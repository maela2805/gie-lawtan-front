import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FinanceService {
  constructor(private api: ApiService) {}

  listTransactions(): Observable<any[]> {
    return this.api.get<any[]>('/finance/transactions');
  }

  createTransaction(transaction: any): Observable<any> {
    return this.api.post<any>('/finance/transactions', transaction);
  }

  getSoldes(): Observable<any> {
    return this.api.get<any>('/finance/soldes');
  }
}
