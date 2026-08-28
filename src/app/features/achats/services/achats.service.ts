import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AchatsService {
  constructor(private api: ApiService) {}

  listFournisseurs(): Observable<any[]> {
    return this.api.get<any[]>('/achats/fournisseurs');
  }

  createFournisseur(fournisseur: any): Observable<any> {
    return this.api.post<any>('/achats/fournisseurs', fournisseur);
  }

  listCommandes(): Observable<any[]> {
    return this.api.get<any[]>('/achats/commandes');
  }

  createCommande(commande: any): Observable<any> {
    return this.api.post<any>('/achats/commandes', commande);
  }
}
