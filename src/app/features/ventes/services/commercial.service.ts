import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CommercialService {
  constructor(private api: ApiService) {}

  listClients(): Observable<any[]> {
    return this.api.get<any[]>('/commercial/clients');
  }

  createClient(client: any): Observable<any> {
    return this.api.post<any>('/commercial/clients', client);
  }

  listCatalogue(): Observable<any[]> {
    return this.api.get<any[]>('/commercial/catalogue');
  }

  createCatalogueItem(item: any): Observable<any> {
    return this.api.post<any>('/commercial/catalogue', item);
  }

  listFactures(): Observable<any[]> {
    return this.api.get<any[]>('/commercial/factures');
  }

  getFacture(id: number): Observable<any> {
    return this.api.get<any>(`/commercial/factures/${id}`);
  }

  createFacture(facture: any): Observable<any> {
    return this.api.post<any>('/commercial/factures', facture);
  }

  updateFacture(id: number, facture: any): Observable<any> {
    return this.api.put<any>(`/commercial/factures/${id}`, facture);
  }
}
