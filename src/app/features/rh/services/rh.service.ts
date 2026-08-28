import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RhService {
  constructor(private api: ApiService) {}

  listEmployes(categorie?: string, categories?: string[]): Observable<any[]> {
    let params: any = {};
    if (categories && categories.length > 0) {
      params.categories = categories.join(',');
    } else if (categorie && categorie !== 'TOUTES') {
      params.categorie = categorie;
    }
    return this.api.get<any[]>('/rh/employes', params);
  }

  createEmploye(employe: any): Observable<any> {
    return this.api.post<any>('/rh/employes', employe);
  }

  listPointages(): Observable<any[]> {
    return this.api.get<any[]>('/rh/pointages');
  }

  createPointage(pointage: any): Observable<any> {
    return this.api.post<any>('/rh/pointages', pointage);
  }
}
