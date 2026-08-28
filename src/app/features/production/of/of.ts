import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductionService } from '../services/production.service';
import { ApiService } from '../../../core/services/api.service';
import { PaginationComponent } from '../../../shared/pagination/pagination';
import { catchError, forkJoin, of } from 'rxjs';
import { LucideAngularModule, Plus, Factory, Play, CheckCircle2, Search, Filter, Paperclip, Check, X } from 'lucide-angular';

@Component({
  selector: 'app-of',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './of.html',
  styleUrl: './of.scss',
})
export class Of implements OnInit {
  readonly Plus = Plus;
  readonly Factory = Factory;
  readonly Play = Play;
  readonly CheckCircle2 = CheckCircle2;
  readonly Search = Search;
  readonly Filter = Filter;
  readonly Paperclip = Paperclip;
  readonly Check = Check;
  readonly X = X;

  ordresFabrication: any[] = [];
  clients: any[] = [];
  machines: any[] = [];
  employes: any[] = [];

  selectedEmployeIds: number[] = [];
  empSearchTerm = '';

  filterClient = '';
  filterStatut = 'TOUS';
  filterDate = '';

  // Pagination
  currentPage = 1;
  pageSize = 8;

  isLoading = true;
  isSubmitting = false;
  openModal = false;
  toastMessage = '';

  formData = {
    date: new Date().toISOString().split("T")[0],
    heureDebut: "08:00",
    heureFinPrevue: "17:00",
    clientId: "",
    machineId: "",
    nombreSacsPrevisionnel: 200,
    media: "",
    observations: "",
    statut: "Brouillon"
  };

  constructor(
    private productionService: ProductionService,
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

  loadData() {
    this.isLoading = true;
    this.cdr.markForCheck();

    forkJoin({
      ofs: this.productionService.listOrdresFabrication().pipe(catchError(() => of([]))),
      clients: this.api.get<any[]>('/commercial/clients').pipe(catchError(() => of([]))),
      machines: this.api.get<any[]>('/parc/machines').pipe(catchError(() => of([]))),
      employes: this.api.get<any[]>('/rh/employes').pipe(catchError(() => of([])))
    }).subscribe(({ ofs, clients, machines, employes }) => {
      this.ordresFabrication = ofs || [];
      
      let clientList = clients && clients.length ? [...clients] : [];
      if (!clientList.some(c => c.nom?.toLowerCase().includes('lawtan'))) {
        clientList.unshift({
          id: 999,
          nom: 'GIE LAWTAN',
          prenom: '(Stock Propre)',
          code: 'LAW-INT',
          type: 'Interne'
        });
      }
      this.clients = clientList;
      this.machines = machines?.length ? machines : [];
      this.employes = employes?.length ? employes : [];
      this.isLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  get employesUsine(): any[] {
    const list = this.employes.filter(e => !e.categorie || e.categorie === 'Usine');
    if (!this.empSearchTerm) return list;
    const term = this.empSearchTerm.toLowerCase();
    return list.filter(e => 
      e.nom?.toLowerCase().includes(term) ||
      e.prenom?.toLowerCase().includes(term) ||
      e.fonction?.toLowerCase().includes(term)
    );
  }

  get machinesDecortiqueuses() {
    return this.machines.filter(m => m.categorie === "Décortiqueuse" || m.categorie === "Autre");
  }

  get filteredOFs(): any[] {
    return this.ordresFabrication.filter(ofItem => {
      const matchClient = !this.filterClient || ofItem.clientId == this.filterClient;
      const matchStatut = this.filterStatut === 'TOUS' || ofItem.statut === this.filterStatut;
      const matchDate = !this.filterDate || ofItem.date === this.filterDate;
      return matchClient && matchStatut && matchDate;
    });
  }

  get paginatedOFs(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredOFs.slice(start, start + this.pageSize);
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

  openCreateModal() {
    this.formData = {
      date: new Date().toISOString().split("T")[0],
      heureDebut: "08:00",
      heureFinPrevue: "17:00",
      clientId: this.clients[0]?.id || "",
      machineId: this.machinesDecortiqueuses[0]?.id || this.machines[0]?.id || "",
      nombreSacsPrevisionnel: 200,
      media: "",
      observations: "",
      statut: "Brouillon"
    };
    this.selectedEmployeIds = [];
    this.empSearchTerm = '';
    this.openModal = true;
    this.cdr.markForCheck();
  }

  handleSubmit() {
    this.isSubmitting = true;
    const client = this.clients.find(c => c.id == this.formData.clientId);
    const machine = this.machines.find(m => m.id == this.formData.machineId);

    const selectedEmps = this.employes
      .filter(e => this.selectedEmployeIds.includes(e.id))
      .map(e => `${e.prenom || ''} ${e.nom}`.trim());

    const responsableStr = selectedEmps.length > 0 ? selectedEmps.join(', ') : 'Équipe Usine';

    const num = `OF-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const payload = {
      date: this.formData.date,
      heureDebut: this.formData.heureDebut,
      heureFinPrevue: this.formData.heureFinPrevue,
      clientId: this.formData.clientId,
      clientNom: client ? `${client.prenom || ''} ${client.nom}`.trim() : "Client Inconnu",
      machineId: this.formData.machineId,
      machineNom: machine?.designation || "Décortiqueuse",
      responsable: responsableStr,
      nombreSacsPrevisionnel: this.formData.nombreSacsPrevisionnel,
      media: this.formData.media,
      observations: this.formData.observations,
      numero: num,
      statut: "Brouillon"
    };

    this.api.post<any>('/production/ofs', payload).subscribe({
      next: () => {
        this.openModal = false;
        this.isSubmitting = false;
        this.showToast(`✓ Ordre de Fabrication ${num} créé en Brouillon !`);
        this.loadData();
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      },
      error: () => {
        alert("Erreur lors de la création de l'OF");
        this.isSubmitting = false;
        this.cdr.markForCheck();
      }
    });
  }

  lancerOF(ofItem: any) {
    this.productionService.lancerOrdreFabrication(ofItem.id).pipe(
      catchError(err => {
        alert("Erreur lors du passage en production");
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        this.showToast(`✓ OF ${ofItem.numero} passé en production avec succès !`);
        this.loadData();
      }
    });
  }
}
