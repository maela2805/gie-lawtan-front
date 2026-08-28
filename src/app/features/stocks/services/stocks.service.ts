import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StocksService {
  constructor(private api: ApiService) {}

  listPaddy(): Observable<any[]> {
    return this.api.get<any[]>('/stocks/paddy');
  }

  listArticles(): Observable<any[]> {
    return this.api.get<any[]>('/stocks/articles');
  }

  listBonsReception(): Observable<any[]> {
    return this.api.get<any[]>('/stocks/brp'); // Supposing we have this in the backend, or we map it to paddy receptions
  }

  createBRP(data: any): Observable<any> {
    return this.api.post<any>('/stocks/paddy/reception', data);
  }

  listMouvements(): Observable<any[]> {
    return this.api.get<any[]>('/stocks/mouvements');
  }
}
