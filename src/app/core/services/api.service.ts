import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, shareReplay, finalize, catchError } from 'rxjs';
import { environment } from '../../../environments/environment';

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  
  // Cache mémoire haute performance
  private memoryCache = new Map<string, CacheEntry<any>>();
  
  // Requêtes en cours pour éviter les appels en double simultanés (déduplication)
  private inFlightRequests = new Map<string, Observable<any>>();
  
  // TTL étendu à 5 minutes pour une fluidité maximale
  private defaultTtlMs = 300000;

  constructor(private http: HttpClient) {
    this.restoreCacheFromStorage();
    // Préchauffage automatique en arrière-plan
    setTimeout(() => this.preloadEssentialData(), 100);
  }

  /**
   * Requête GET ultra-rapide avec Cache-First + Stale While Revalidate
   */
  get<T>(endpoint: string, params?: any, forceRefresh: boolean = false, ttlMs: number = this.defaultTtlMs): Observable<T> {
    const cacheKey = this.generateCacheKey(endpoint, params);
    const now = Date.now();

    // 1. Si on a des données valides en cache mémoire et qu'on ne force pas le refresh -> Réponse 0 ms
    if (!forceRefresh && this.memoryCache.has(cacheKey)) {
      const entry = this.memoryCache.get(cacheKey)!;
      if (entry.expiry > now) {
        return of(this.cloneData(entry.data));
      } else {
        this.memoryCache.delete(cacheKey);
      }
    }

    // 2. Si une requête identique est déjà en vol, la partager sans refaire d'appel HTTP
    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey)!;
    }

    // 3. Exécution de la requête réseau
    const req$ = this.http.get<T>(`${this.apiUrl}${endpoint}`, { params }).pipe(
      tap((data) => {
        this.setCache(cacheKey, data, ttlMs);
      }),
      catchError((err) => {
        // En cas d'erreur réseau, si on a une version expirée en cache, on la renvoie pour ne pas bloquer l'UI
        if (this.memoryCache.has(cacheKey)) {
          return of(this.cloneData(this.memoryCache.get(cacheKey)!.data));
        }
        throw err;
      }),
      finalize(() => {
        this.inFlightRequests.delete(cacheKey);
      }),
      shareReplay(1)
    );

    this.inFlightRequests.set(cacheKey, req$);
    return req$;
  }

  /**
   * Requête POST avec invalidation automatique du cache associé
   */
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}${endpoint}`, data).pipe(
      tap(() => this.invalidateCacheForEndpoint(endpoint))
    );
  }

  /**
   * Requête PUT avec invalidation automatique du cache associé
   */
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}${endpoint}`, data).pipe(
      tap(() => this.invalidateCacheForEndpoint(endpoint))
    );
  }

  /**
   * Requête DELETE avec invalidation automatique du cache associé
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}${endpoint}`).pipe(
      tap(() => this.invalidateCacheForEndpoint(endpoint))
    );
  }

  /**
   * Préchauffage (Warmup) automatique des données clés
   */
  preloadEssentialData(): void {
    const endpoints = [
      '/production/ofs',
      '/stocks/articles',
      '/commercial/clients',
      '/stocks/paddy',
      '/finance/caisse/resume'
    ];
    endpoints.forEach(ep => {
      this.get(ep).subscribe({
        next: () => {},
        error: () => {}
      });
    });
  }

  private setCache(key: string, data: any, ttlMs: number): void {
    const entry: CacheEntry<any> = {
      data: this.cloneData(data),
      expiry: Date.now() + ttlMs
    };
    this.memoryCache.set(key, entry);
    try {
      sessionStorage.setItem(`agro_cache_${key}`, JSON.stringify(entry));
    } catch {
      // Ignorer si quota storage plein
    }
  }

  private restoreCacheFromStorage(): void {
    try {
      const now = Date.now();
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('agro_cache_')) {
          const raw = sessionStorage.getItem(key);
          if (raw) {
            const entry = JSON.parse(raw);
            if (entry && entry.expiry > now) {
              const cacheKey = key.replace('agro_cache_', '');
              this.memoryCache.set(cacheKey, entry);
            }
          }
        }
      }
    } catch {
      // Ignorer
    }
  }

  invalidateCacheForEndpoint(endpoint: string): void {
    const segments = endpoint.split('/').filter(Boolean);
    const prefix = segments.length > 0 ? `/${segments[0]}` : endpoint;

    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
        try {
          sessionStorage.removeItem(`agro_cache_${key}`);
        } catch {}
      }
    }
  }

  clearAllCache(): void {
    this.memoryCache.clear();
    this.inFlightRequests.clear();
    try {
      Object.keys(sessionStorage)
        .filter(k => k.startsWith('agro_cache_'))
        .forEach(k => sessionStorage.removeItem(k));
    } catch {}
  }

  private generateCacheKey(endpoint: string, params?: any): string {
    if (!params) return endpoint;
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&');
    return `${endpoint}?${sortedParams}`;
  }

  private cloneData<T>(data: T): T {
    if (data === null || data === undefined) return data;
    try {
      return JSON.parse(JSON.stringify(data));
    } catch {
      return data;
    }
  }
}
