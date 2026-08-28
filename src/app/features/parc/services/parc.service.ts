import { Injectable } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ParcService {
  constructor(private api: ApiService) {}

  listMachines(): Observable<any[]> {
    return this.api.get<any[]>('/parc/machines');
  }

  createMachine(machine: any): Observable<any> {
    return this.api.post<any>('/parc/machines', machine);
  }

  listInterventions(): Observable<any[]> {
    return this.api.get<any[]>('/parc/interventions');
  }

  createIntervention(intervention: any): Observable<any> {
    return this.api.post<any>('/parc/interventions', intervention);
  }

  listMaintenances(): Observable<any[]> {
    return this.api.get<any[]>('/parc/maintenances');
  }

  createMaintenance(maintenance: any): Observable<any> {
    return this.api.post<any>('/parc/maintenances', maintenance);
  }
}
