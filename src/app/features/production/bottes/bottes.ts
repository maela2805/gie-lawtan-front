import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductionService } from '../services/production.service';
import { ApiService } from '../../../core/services/api.service';
import { catchError, forkJoin, of } from 'rxjs';
import { LucideAngularModule, Tractor, Plus, Play, CheckCircle2, Search, Clock, Package, Check, X } from 'lucide-angular';

import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-production-bottes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './bottes.html',
  styleUrl: './bottes.scss',
})
export class Bottes implements OnInit {
  readonly Tractor = Tractor;
  readonly Plus = Plus;
  readonly Play = Play;
  readonly CheckCircle2 = CheckCircle2;
  readonly Search = Search;
  readonly Clock = Clock;
  readonly Package = Package;
  readonly Check = Check;
  readonly X = X;

  productions: any[] = [];
  machines: any[] = [];
  employes: any[] = [];
  clients: any[] = [];

  selectedOperateurIds: number[] = [];
  opSearchTerm = '';

  currentPage = 1;
  pageSize = 8;

  isLoading = true;
  isSubmitting = false;
  openCreateModal = false;
  openClotureModal = false;
  selectedPressage: any = null;
  toastMessage = '';

  formData = {
    date: new Date().toISOString().split("T")[0],
    parcelle: "",
    clientId: "",
    machineId: "",
    responsable: "Ousmane Fall",
    observations: "",
    statut: "Brouillon"
  };

  clotureForm = {
    quantiteBottes: 150,
    nombreHeures: 4.5
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
      pressages: this.productionService.listPressages().pipe(catchError(() => of([]))),
      machines: this.api.get<any[]>('/parc/machines').pipe(catchError(() => of([]))),
      employes: this.api.get<any[]>('/rh/employes').pipe(catchError(() => of([]))),
      clients: this.api.get<any[]>('/commercial/clients').pipe(catchError(() => of([])))
    }).subscribe(({ pressages, machines, employes, clients }) => {
      this.productions = pressages || [];
      this.machines = machines || [];
      this.employes = employes || [];
      this.clients = clients || [];
      this.isLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  get paginatedProductions(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.productions.slice(start, start + this.pageSize);
  }

  get operateursBotte(): any[] {
    const list = this.employes.filter(e => !e.categorie || e.categorie === 'Botte');
    if (!this.opSearchTerm) return list;
    const term = this.opSearchTerm.toLowerCase();
    return list.filter(e => 
      e.nom?.toLowerCase().includes(term) ||
      e.prenom?.toLowerCase().includes(term) ||
      e.fonction?.toLowerCase().includes(term)
    );
  }

  get machinesPresses(): any[] {
    return this.machines.filter(m => 
      m.categorie?.toLowerCase().includes('presse') || 
      m.designation?.toLowerCase().includes('presse') ||
      m.categorie?.toLowerCase().includes('tracteur')
    );
  }

  toggleOperateur(id: number) {
    const idx = this.selectedOperateurIds.indexOf(id);
    if (idx > -1) {
      this.selectedOperateurIds.splice(idx, 1);
    } else {
      this.selectedOperateurIds.push(id);
    }
  }

  isOperateurSelected(id: number): boolean {
    return this.selectedOperateurIds.includes(id);
  }

  openCreate() {
    this.formData = {
      date: new Date().toISOString().split("T")[0],
      parcelle: "",
      clientId: this.clients[0]?.id || "",
      machineId: this.machinesPresses[0]?.id || this.machines[0]?.id || "",
      responsable: "Ousmane Fall",
      observations: "",
      statut: "Brouillon"
    };
    this.selectedOperateurIds = [];
    this.opSearchTerm = '';
    this.openCreateModal = true;
    this.cdr.markForCheck();
  }

  handleCreate() {
    this.isSubmitting = true;
    const client = this.clients.find(c => c.id == this.formData.clientId);
    const machine = this.machines.find(m => m.id == this.formData.machineId);

    const selectedOps = this.employes
      .filter(e => this.selectedOperateurIds.includes(e.id))
      .map(e => `${e.prenom || ''} ${e.nom}`.trim());

    const operateursStr = selectedOps.length > 0 ? selectedOps.join(', ') : 'Équipe Botte';

    const payload = {
      numero: `BOT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      date: this.formData.date,
      parcelle: this.formData.parcelle,
      clientId: this.formData.clientId,
      clientNom: client ? `${client.prenom || ''} ${client.nom}`.trim() : "Client Divers",
      machineId: this.formData.machineId,
      machineNom: machine?.designation || "Presse à paille",
      responsable: this.formData.responsable,
      operateurs: operateursStr,
      statut: "Brouillon",
      observations: this.formData.observations
    };

    this.productionService.createPressage(payload).pipe(
      catchError(err => {
        alert("Erreur lors de l'enregistrement");
        this.isSubmitting = false;
        this.cdr.markForCheck();
        return of(null);
      })
    ).subscribe(res => {
      this.openCreateModal = false;
      this.isSubmitting = false;
      if (res) {
        this.showToast(`✓ Chantier de pressage ${payload.numero} créé avec succès !`);
        this.loadData();
      }
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  lancer(p: any) {
    this.productionService.lancerPressage(p.id).pipe(
      catchError(err => {
        alert("Erreur lors du passage en production");
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        this.showToast(`✓ Pressage ${p.numero} passé en production.`);
        this.loadData();
      }
    });
  }

  openCloture(p: any) {
    this.selectedPressage = p;
    this.clotureForm = {
      quantiteBottes: p.quantiteBottes || 150,
      nombreHeures: p.nombreHeures || 4.0
    };
    this.openClotureModal = true;
    this.cdr.markForCheck();
  }

  handleCloture() {
    if (!this.selectedPressage) return;
    this.isSubmitting = true;

    this.productionService.cloturerPressage(this.selectedPressage.id, this.clotureForm).pipe(
      catchError(err => {
        alert("Erreur lors de la clôture du pressage");
        this.isSubmitting = false;
        this.cdr.markForCheck();
        return of(null);
      })
    ).subscribe(res => {
      this.openClotureModal = false;
      this.isSubmitting = false;
      if (res) {
        this.showToast(`✓ Pressage ${this.selectedPressage.numero} clôturé : +${this.clotureForm.quantiteBottes} bottes entrées en stock.`);
        this.loadData();
      }
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }
}
