import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ProductionService {
  constructor(private api: ApiService) {}

  listOrdresFabrication(filters?: { clientId?: number | string; statut?: string; date?: string }): Observable<any[]> {
    let params: any = {};
    if (filters?.clientId) params.clientId = filters.clientId;
    if (filters?.statut && filters.statut !== 'TOUS') params.statut = filters.statut;
    if (filters?.date) params.date = filters.date;
    return this.api.get<any[]>('/production/ofs', params);
  }

  lancerOrdreFabrication(id: number): Observable<any> {
    return this.api.post<any>(`/production/ofs/${id}/lancer`, {});
  }

  clotureOrdreFabrication(id: number, resultats: any): Observable<any> {
    return this.api.post<any>(`/production/ofs/${id}/cloturer`, resultats);
  }

  // Pressage de Bottes
  listPressages(): Observable<any[]> {
    return this.api.get<any[]>('/production/bottes');
  }

  createPressage(pressage: any): Observable<any> {
    return this.api.post<any>('/production/bottes', pressage);
  }

  lancerPressage(id: number): Observable<any> {
    return this.api.post<any>(`/production/bottes/${id}/lancer`, {});
  }

  cloturerPressage(id: number, data: { quantiteBottes: number; nombreHeures: number }): Observable<any> {
    return this.api.post<any>(`/production/bottes/${id}/cloturer`, data);
  }
}
