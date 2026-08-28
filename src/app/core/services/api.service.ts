import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap, shareReplay, finalize } from 'rxjs';
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
  
  // Cache en mémoire : Clé -> { data, expiry }
  private cache = new Map<string, CacheEntry<any>>();
  
  // Requêtes en cours pour éviter les appels en double simultanés (déduplication)
  private inFlightRequests = new Map<string, Observable<any>>();
  
  // TTL par défaut : 60 secondes
  private defaultTtlMs = 60000;

  constructor(private http: HttpClient) {}

  /**
   * Requête GET optimisée avec cache mémoire et déduplication
   */
  get<T>(endpoint: string, params?: any, forceRefresh: boolean = false, ttlMs: number = this.defaultTtlMs): Observable<T> {
    const cacheKey = this.generateCacheKey(endpoint, params);
    const now = Date.now();

    // 1. Si on a des données valides en cache et qu'on ne force pas le refresh
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const entry = this.cache.get(cacheKey)!;
      if (entry.expiry > now) {
        return of(this.cloneData(entry.data));
      } else {
        this.cache.delete(cacheKey);
      }
    }

    // 2. Si une requête identique est déjà en cours d'exécution, on la partage
    if (this.inFlightRequests.has(cacheKey)) {
      return this.inFlightRequests.get(cacheKey)!;
    }

    // 3. Exécution de la requête réseau
    const req$ = this.http.get<T>(`${this.apiUrl}${endpoint}`, { params }).pipe(
      tap((data) => {
        this.cache.set(cacheKey, {
          data: this.cloneData(data),
          expiry: Date.now() + ttlMs
        });
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
   * Invalider le cache pour un module ou un groupe d'endpoints
   */
  invalidateCacheForEndpoint(endpoint: string): void {
    // Extrait le préfixe principal (ex: /production, /stocks, /commercial, /finance)
    const segments = endpoint.split('/').filter(Boolean);
    const prefix = segments.length > 0 ? `/${segments[0]}` : endpoint;

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Vider complètement le cache
   */
  clearAllCache(): void {
    this.cache.clear();
    this.inFlightRequests.clear();
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
