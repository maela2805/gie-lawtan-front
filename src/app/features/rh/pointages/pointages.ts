import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RhService } from '../services/rh.service';
import { ProductionService } from '../../production/services/production.service';
import { ParcService } from '../../parc/services/parc.service';
import { LucideAngularModule, FileClock, Plus, Clock, Search, CheckCircle2, Factory, Tractor, Calendar, Users, Zap, Check, X } from 'lucide-angular';
import { catchError, forkJoin, of } from 'rxjs';

import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-pointages',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './pointages.html',
  styleUrl: './pointages.scss',
})
export class Pointages implements OnInit {
  readonly FileClock = FileClock;
  readonly Plus = Plus;
  readonly Clock = Clock;
  readonly Search = Search;
  readonly CheckCircle2 = CheckCircle2;
  readonly Factory = Factory;
  readonly Tractor = Tractor;
  readonly Calendar = Calendar;
  readonly Users = Users;
  readonly Zap = Zap;
  readonly Check = Check;
  readonly X = X;

  pointages: any[] = [];
  employes: any[] = [];
  machines: any[] = [];

  // Tâches du jour
  ofsDuJour: any[] = [];
  pressagesDuJour: any[] = [];
  interventionsDuJour: any[] = [];

  currentPage = 1;
  pageSize = 8;

  isLoading = true;
  isSubmitting = false;
  openModal = false;
  searchTerm = '';
  selectedActivite = 'TOUTES';
  toastMessage = '';

  filterDate = new Date().toISOString().split('T')[0];

  activites = ['TOUTES', 'Usine (Transformation)', 'Pressage Bottes', 'Moissonnage', 'Labour / Transport', 'Autre'];

  formData = {
    date: new Date().toISOString().split('T')[0],
    employeId: '',
    employeNom: '',
    activite: 'Usine (Transformation)',
    machineId: '',
    machineNom: '',
    equipe: 'Équipe Jour',
    heureArrivee: '08:00',
    heureDepart: '17:00',
    heuresTravaillees: 8,
    coutMainOeuvre: 4000
  };

  constructor(
    private rhService: RhService,
    private productionService: ProductionService,
    private parcService: ParcService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.markForCheck();
    }, 4000);
  }

  loadData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    forkJoin({
      pointages: this.rhService.listPointages().pipe(catchError(() => of([]))),
      employes: this.rhService.listEmployes().pipe(catchError(() => of([]))),
      machines: this.parcService.listMachines().pipe(catchError(() => of([]))),
      ofs: this.productionService.listOrdresFabrication().pipe(catchError(() => of([]))),
      pressages: this.productionService.listPressages().pipe(catchError(() => of([]))),
      interventions: this.parcService.listInterventions().pipe(catchError(() => of([])))
    }).subscribe(({ pointages, employes, machines, ofs, pressages, interventions }) => {
      this.pointages = pointages || [];
      this.employes = employes || [];
      this.machines = machines || [];

      this.ofsDuJour = (ofs || []).filter(o => o.date === this.filterDate);
      this.pressagesDuJour = (pressages || []).filter(p => p.date === this.filterDate);
      this.interventionsDuJour = (interventions || []).filter(i => i.date === this.filterDate);

      this.isLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  onDateChange(): void {
    this.loadData();
  }

  get filteredPointages(): any[] {
    return this.pointages.filter(p => {
      const matchDate = !this.filterDate || p.date === this.filterDate;
      const matchAct = this.selectedActivite === 'TOUTES' || p.activite?.toLowerCase().includes(this.selectedActivite.toLowerCase());
      const matchSearch = !this.searchTerm ||
        p.employeNom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.activite?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        p.machineNom?.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchDate && matchAct && matchSearch;
    });
  }

  get paginatedPointages(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredPointages.slice(start, start + this.pageSize);
  }

  get totalPointages(): number {
    return this.filteredPointages.length;
  }

  get totalHeures(): number {
    return this.filteredPointages.reduce((sum, p) => sum + (p.heuresTravaillees || 0), 0);
  }

  get totalCout(): number {
    return this.filteredPointages.reduce((sum, p) => sum + (p.coutMainOeuvre || 0), 0);
  }

  pointerDepuisTache(typeTache: string, item: any): void {
    let emp = this.employes[0];
    if (item.responsable || item.operateurs) {
      const nomCherche = (item.responsable || item.operateurs || '').split(',')[0].trim();
      const matched = this.employes.find(e => `${e.prenom || ''} ${e.nom}`.includes(nomCherche) || nomCherche.includes(e.nom));
      if (matched) emp = matched;
    }

    this.formData = {
      date: this.filterDate,
      employeId: emp?.id || '',
      employeNom: emp ? `${emp.prenom || ''} ${emp.nom}`.trim() : '',
      activite: typeTache,
      machineId: item.machineId || this.machines[0]?.id || '',
      machineNom: item.machineNom || item.machine || '',
      equipe: item.numero || 'Équipe Jour',
      heureArrivee: item.heureDebut || '08:00',
      heureDepart: item.heureFin || item.heureFinPrevue || '17:00',
      heuresTravaillees: 8,
      coutMainOeuvre: emp?.salaireBase || 4000
    };
    this.openModal = true;
    this.cdr.markForCheck();
  }

  openCreateModal(): void {
    const emp = this.employes[0];
    this.formData = {
      date: this.filterDate,
      employeId: emp?.id || '',
      employeNom: emp ? `${emp.prenom || ''} ${emp.nom}`.trim() : '',
      activite: 'Usine (Transformation)',
      machineId: this.machines[0]?.id || '',
      machineNom: this.machines[0]?.designation || '',
      equipe: 'Équipe Jour',
      heureArrivee: '08:00',
      heureDepart: '17:00',
      heuresTravaillees: 8,
      coutMainOeuvre: emp?.salaireBase || 4000
    };
    this.openModal = true;
    this.cdr.markForCheck();
  }

  onEmployeChange(): void {
    const emp = this.employes.find(e => e.id == this.formData.employeId);
    if (emp) {
      this.formData.employeNom = `${emp.prenom || ''} ${emp.nom}`.trim();
      this.formData.coutMainOeuvre = emp.salaireBase || 4000;
    }
  }

  handleSubmit(): void {
    this.isSubmitting = true;
    const emp = this.employes.find(e => e.id == this.formData.employeId);
    const machine = this.machines.find(m => m.id == this.formData.machineId);

    const payload = {
      ...this.formData,
      employeNom: emp ? `${emp.prenom || ''} ${emp.nom}`.trim() : this.formData.employeNom,
      machineNom: machine?.designation || this.formData.machineNom
    };

    this.rhService.createPointage(payload).pipe(
      catchError(err => {
        alert("Erreur lors de l'enregistrement du pointage");
        this.isSubmitting = false;
        this.cdr.markForCheck();
        return of(null);
      })
    ).subscribe(res => {
      this.openModal = false;
      this.isSubmitting = false;
      if (res) {
        this.showToast(`✓ Pointage journalier validé pour ${payload.employeNom} !`);
        this.loadData();
      }
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  }
}
