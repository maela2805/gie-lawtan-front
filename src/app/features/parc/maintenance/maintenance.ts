import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParcService } from '../services/parc.service';
import { LucideAngularModule, Wrench, Plus, AlertTriangle, CheckCircle2, Clock, Search } from 'lucide-angular';
import { catchError, forkJoin, of } from 'rxjs';

import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-maintenance',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './maintenance.html',
  styleUrl: './maintenance.scss',
})
export class Maintenance implements OnInit {
  readonly Wrench = Wrench;
  readonly Plus = Plus;
  readonly AlertTriangle = AlertTriangle;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly Search = Search;

  maintenances: any[] = [];
  machines: any[] = [];

  currentPage = 1;
  pageSize = 8;

  isLoading = true;
  isSubmitting = false;
  openModal = false;
  searchTerm = '';
  selectedType = 'TOUS';

  types = ['TOUS', 'Préventive', 'Corrective'];

  formData = {
    machineId: '',
    machineNom: '',
    date: new Date().toISOString().split('T')[0],
    type: 'Préventive',
    description: 'Vidange huile moteur et remplacement filtre',
    piecesRemplacees: 'Filtre à huile, Huile 15W40 (20L)',
    coutPieces: 45000,
    coutMainOeuvre: 15000,
    dureeImmobilisation: 4,
    responsable: 'Mamadou Ndiaye'
  };

  constructor(private parcService: ParcService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      maintenances: this.parcService.listMaintenances().pipe(catchError(() => of([]))),
      machines: this.parcService.listMachines().pipe(catchError(() => of([])))
    }).subscribe(({ maintenances, machines }) => {
      this.maintenances = maintenances || [];
      this.machines = machines || [];
      this.isLoading = false;
    });
  }

  get filteredMaintenances(): any[] {
    return this.maintenances.filter(m => {
      const matchType = this.selectedType === 'TOUS' || m.type === this.selectedType;
      const matchSearch = !this.searchTerm ||
        m.machineNom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        m.description?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        m.responsable?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        m.piecesRemplacees?.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchType && matchSearch;
    });
  }

  get paginatedMaintenances(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredMaintenances.slice(start, start + this.pageSize);
  }

  get totalMaintenances(): number {
    return this.maintenances.length;
  }

  get totalCout(): number {
    return this.maintenances.reduce((sum, m) => sum + (m.coutPieces || 0) + (m.coutMainOeuvre || 0), 0);
  }

  get totalHeuresImmobilisation(): number {
    return this.maintenances.reduce((sum, m) => sum + (m.dureeImmobilisation || 0), 0);
  }

  get machinesEnAlerte(): any[] {
    return this.machines.filter(m => m.compteurHoraire && m.prochaineMaintenance && m.compteurHoraire >= m.prochaineMaintenance);
  }

  openCreateModal(): void {
    this.formData = {
      machineId: this.machines[0]?.id || '',
      machineNom: this.machines[0]?.designation || '',
      date: new Date().toISOString().split('T')[0],
      type: 'Préventive',
      description: 'Vidange huile moteur et remplacement filtre',
      piecesRemplacees: 'Filtre à huile, Huile 15W40 (20L)',
      coutPieces: 45000,
      coutMainOeuvre: 15000,
      dureeImmobilisation: 4,
      responsable: 'Mamadou Ndiaye'
    };
    this.openModal = true;
  }

  handleSubmit(): void {
    this.isSubmitting = true;
    const machine = this.machines.find(m => m.id == this.formData.machineId);

    const payload = {
      ...this.formData,
      machineNom: machine?.designation || this.formData.machineNom
    };

    this.parcService.createMaintenance(payload).pipe(
      catchError(err => {
        alert("Erreur lors de l'enregistrement de la maintenance");
        this.isSubmitting = false;
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        alert('Fiche de maintenance enregistrée avec succès !');
        this.openModal = false;
        this.loadData();
      }
      this.isSubmitting = false;
    });
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  }
}
