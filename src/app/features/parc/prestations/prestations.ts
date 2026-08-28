import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParcService } from '../services/parc.service';
import { ApiService } from '../../../core/services/api.service';
import { RhService } from '../../rh/services/rh.service';
import { LucideAngularModule, Tractor, Plus, CalendarDays, CheckCircle2, Clock, Search, Users, Check, X } from 'lucide-angular';
import { catchError, forkJoin, of } from 'rxjs';

import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-prestations',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './prestations.html',
  styleUrl: './prestations.scss',
})
export class Prestations implements OnInit {
  readonly Tractor = Tractor;
  readonly Plus = Plus;
  readonly CalendarDays = CalendarDays;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly Search = Search;
  readonly Users = Users;
  readonly Check = Check;
  readonly X = X;

  interventions: any[] = [];
  clients: any[] = [];
  machines: any[] = [];
  employes: any[] = [];

  selectedEmployeIds: number[] = [];
  empSearchTerm = '';

  currentPage = 1;
  pageSize = 8;

  isLoading = true;
  isSubmitting = false;
  openModal = false;
  searchTerm = '';
  selectedType = 'TOUS';
  toastMessage = '';

  typesPrestation = ['TOUS', 'Moissonnage', 'Transport', 'Travaux Spécifiques', 'Autre'];

  formData = {
    numero: '',
    clientId: '',
    clientNom: '',
    typePrestation: 'Moissonnage',
    parcelle: '',
    machineId: '',
    machineNom: '',
    date: new Date().toISOString().split('T')[0],
    heureDebut: '07:30',
    heureFin: '14:30',
    duree: 7,
    surfaceTraitee: 5,
    carburantConsomme: 35,
    statut: 'Terminé',
    modePaiement: 'Nature',
    pourcentageNature: 18,
    montantEspeces: 0
  };

  constructor(
    private parcService: ParcService,
    private rhService: RhService,
    private api: ApiService,
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
      interventions: this.parcService.listInterventions().pipe(catchError(() => of([]))),
      clients: this.api.get<any[]>('/commercial/clients').pipe(catchError(() => of([]))),
      machines: this.parcService.listMachines().pipe(catchError(() => of([]))),
      employes: this.rhService.listEmployes().pipe(catchError(() => of([])))
    }).subscribe(({ interventions, clients, machines, employes }) => {
      this.interventions = interventions || [];
      this.clients = clients || [];
      this.machines = machines || [];
      this.employes = employes || [];
      this.isLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  get employesEngins(): any[] {
    const list = this.employes.filter(e => e.categorie === 'Tracteur' || e.categorie === 'Moissonneuse');
    if (!this.empSearchTerm) return list;
    const term = this.empSearchTerm.toLowerCase();
    return list.filter(e => 
      e.nom?.toLowerCase().includes(term) ||
      e.prenom?.toLowerCase().includes(term) ||
      e.fonction?.toLowerCase().includes(term)
    );
  }

  toggleEmploye(id: number) {
    const idx = this.selectedEmployeIds.indexOf(id);
    if (idx > -1) {
      this.selectedEmployeIds.splice(idx, 1);
    } else {
      this.selectedEmployeIds.push(id);
    }
  }

  isEmployeSelected(id: number): boolean {
    return this.selectedEmployeIds.includes(id);
  }

  get filteredInterventions(): any[] {
    return this.interventions.filter(i => {
      const matchType = this.selectedType === 'TOUS' || i.typePrestation === this.selectedType;
      const matchSearch = !this.searchTerm ||
        i.numero?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        i.clientNom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        i.machineNom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        i.operateur?.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchType && matchSearch;
    });
  }

  get paginatedInterventions(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredInterventions.slice(start, start + this.pageSize);
  }

  get totalInterventions(): number {
    return this.interventions.length;
  }

  get totalSurface(): number {
    return this.interventions.reduce((sum, i) => sum + (i.surfaceTraitee || 0), 0);
  }

  get totalCarburant(): number {
    return this.interventions.reduce((sum, i) => sum + (i.carburantConsomme || 0), 0);
  }

  openCreateModal(): void {
    const num = `OI-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    this.formData = {
      numero: num,
      clientId: this.clients[0]?.id || '',
      clientNom: this.clients[0]?.nom || '',
      typePrestation: 'Moissonnage',
      parcelle: 'Parcelle Nord',
      machineId: this.machines[0]?.id || '',
      machineNom: this.machines[0]?.designation || '',
      date: new Date().toISOString().split('T')[0],
      heureDebut: '07:30',
      heureFin: '14:30',
      duree: 7,
      surfaceTraitee: 5,
      carburantConsomme: 35,
      statut: 'Terminé',
      modePaiement: 'Nature',
      pourcentageNature: 18,
      montantEspeces: 0
    };
    this.selectedEmployeIds = [];
    this.empSearchTerm = '';
    this.openModal = true;
    this.cdr.markForCheck();
  }

  onTypeChange(): void {
    if (this.formData.typePrestation === 'Moissonnage') {
      this.formData.modePaiement = 'Nature';
      this.formData.pourcentageNature = 18;
      this.formData.montantEspeces = 0;
    } else {
      this.formData.modePaiement = 'Espèces';
      this.formData.pourcentageNature = 0;
      this.formData.montantEspeces = 150000;
    }
  }

  handleSubmit(): void {
    this.isSubmitting = true;
    const client = this.clients.find(c => c.id == this.formData.clientId);
    const machine = this.machines.find(m => m.id == this.formData.machineId);

    const selectedEmpNames = this.employes
      .filter(e => this.selectedEmployeIds.includes(e.id))
      .map(e => `${e.prenom || ''} ${e.nom}`.trim());

    const operateursStr = selectedEmpNames.length > 0 ? selectedEmpNames.join(', ') : 'Conducteur d\'engin';

    const payload = {
      ...this.formData,
      clientNom: client ? `${client.prenom || ''} ${client.nom}`.trim() : this.formData.clientNom,
      machineNom: machine?.designation || this.formData.machineNom,
      operateur: operateursStr
    };

    this.parcService.createIntervention(payload).pipe(
      catchError(err => {
        alert("Erreur lors de l'enregistrement de la prestation");
        this.isSubmitting = false;
        this.cdr.markForCheck();
        return of(null);
      })
    ).subscribe(res => {
      this.openModal = false;
      this.isSubmitting = false;
      if (res) {
        this.showToast(`✓ Ordre d'intervention ${payload.numero} enregistré !`);
        this.loadData();
      }
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }
}
