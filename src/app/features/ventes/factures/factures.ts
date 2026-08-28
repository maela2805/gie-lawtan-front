import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommercialService } from '../services/commercial.service';
import { FinanceService } from '../../finance/services/finance.service';
import { 
  LucideAngularModule, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Search, 
  Wallet, 
  Check, 
  X, 
  Eye, 
  CreditCard, 
  Printer, 
  Receipt,
  RotateCcw
} from 'lucide-angular';
import { catchError, forkJoin, of } from 'rxjs';

import { PaginationComponent } from '../../../shared/pagination/pagination';

export interface TranchePaiement {
  id: string;
  date: string;
  montant: number;
  mode: string; // Espèces, Wave, Orange Money, Chèque, Virement
  referenceRecu: string;
  compteCaisse: string;
  agent: string;
  note?: string;
}

@Component({
  selector: 'app-factures',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './factures.html',
  styleUrl: './factures.scss',
})
export class Factures implements OnInit {
  readonly FileText = FileText;
  readonly Plus = Plus;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly Search = Search;
  readonly Wallet = Wallet;
  readonly Check = Check;
  readonly X = X;
  readonly Eye = Eye;
  readonly CreditCard = CreditCard;
  readonly Printer = Printer;
  readonly Receipt = Receipt;
  readonly RotateCcw = RotateCcw;
  readonly Math = Math;

  factures: any[] = [];
  clients: any[] = [];

  currentPage = 1;
  pageSize = 8;

  isLoading = true;
  isSubmitting = false;
  openModal = false;
  openDetailsModal = false;
  openPaiementModal = false;

  selectedFacture: any = null;
  searchTerm = '';
  selectedStatut = 'TOUS';
  toastMessage = '';

  statuts = ['TOUS', 'Payée', 'Partiellement payée', 'Émise'];

  // Formulaire Nouvelle Facture
  formData = {
    reference: '',
    clientId: '',
    clientNom: '',
    date: new Date().toISOString().split('T')[0],
    montantTotal: 250000,
    montantPaye: 0,
    typePrestation: 'Usinage Riz Blanc',
    referenceOF: '',
    observations: '',
    statut: 'Émise'
  };

  // Formulaire Paiement par Tranche
  paiementForm = {
    montant: 0,
    date: new Date().toISOString().split('T')[0],
    mode: 'Espèces',
    compteCaisse: 'Caisse principale',
    referenceRecu: '',
    agent: 'Ousmane Fall',
    note: ''
  };

  constructor(
    private commercialService: CommercialService,
    private financeService: FinanceService,
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
    }, 4500);
  }

  loadData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    forkJoin({
      factures: this.commercialService.listFactures().pipe(catchError(() => of([]))),
      clients: this.commercialService.listClients().pipe(catchError(() => of([])))
    }).subscribe(({ factures, clients }) => {
      this.factures = (factures || []).map(f => this.parseFacture(f));
      this.clients = clients || [];
      this.isLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  parseFacture(f: any): any {
    let paiements: TranchePaiement[] = [];
    if (f.historiquePaiements) {
      try {
        paiements = typeof f.historiquePaiements === 'string' 
          ? JSON.parse(f.historiquePaiements) 
          : f.historiquePaiements;
      } catch (e) {
        paiements = [];
      }
    }
    return {
      ...f,
      paiements: paiements
    };
  }

  get filteredFactures(): any[] {
    return this.factures.filter(f => {
      const matchStatut = this.selectedStatut === 'TOUS' || f.statut === this.selectedStatut;
      const matchSearch = !this.searchTerm ||
        f.reference?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        f.clientNom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        f.date?.includes(this.searchTerm) ||
        f.typePrestation?.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchStatut && matchSearch;
    });
  }

  get paginatedFactures(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredFactures.slice(start, start + this.pageSize);
  }

  get totalFacture(): number {
    return this.factures.reduce((sum, f) => sum + (f.montantTotal || 0), 0);
  }

  get totalEncaisse(): number {
    return this.factures.reduce((sum, f) => sum + (f.montantPaye || 0), 0);
  }

  get totalReste(): number {
    return Math.max(0, this.totalFacture - this.totalEncaisse);
  }

  get tauxRecouvrement(): number {
    if (this.totalFacture === 0) return 100;
    return Math.min(100, Math.round((this.totalEncaisse / this.totalFacture) * 100));
  }

  // --- NOUVELLE FACTURE ---
  openCreateModal(): void {
    const ref = `FAC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    this.formData = {
      reference: ref,
      clientId: this.clients[0]?.id || '',
      clientNom: this.clients[0]?.nom || '',
      date: new Date().toISOString().split('T')[0],
      montantTotal: 350000,
      montantPaye: 0,
      typePrestation: 'Usinage Riz Blanc',
      referenceOF: '',
      observations: '',
      statut: 'Émise'
    };
    this.openModal = true;
    this.cdr.markForCheck();
  }

  onMontantChange(): void {
    if (this.formData.montantPaye >= this.formData.montantTotal) {
      this.formData.statut = 'Payée';
    } else if (this.formData.montantPaye > 0) {
      this.formData.statut = 'Partiellement payée';
    } else {
      this.formData.statut = 'Émise';
    }
  }

  handleSubmit(): void {
    this.isSubmitting = true;
    const client = this.clients.find(c => c.id == this.formData.clientId);

    let initialPaiements: TranchePaiement[] = [];
    if (this.formData.montantPaye > 0) {
      initialPaiements.push({
        id: `TR-${Date.now()}`,
        date: this.formData.date,
        montant: this.formData.montantPaye,
        mode: 'Espèces',
        referenceRecu: `REC-${this.formData.reference}-01`,
        compteCaisse: 'Caisse principale',
        agent: 'Ousmane Fall',
        note: 'Acompte initial à la création'
      });
    }

    const payload = {
      ...this.formData,
      clientNom: client ? `${client.prenom || ''} ${client.nom}`.trim() : this.formData.clientNom,
      historiquePaiements: JSON.stringify(initialPaiements)
    };

    this.commercialService.createFacture(payload).pipe(
      catchError(err => {
        alert("Erreur lors de l'émission de la facture");
        this.isSubmitting = false;
        this.cdr.markForCheck();
        return of(null);
      })
    ).subscribe(res => {
      this.openModal = false;
      this.isSubmitting = false;
      if (res) {
        this.showToast(`✓ Facture ${payload.reference} émise avec succès !`);
        this.loadData();
      }
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  // --- DÉTAILS DE LA FACTURE ---
  viewDetails(facture: any): void {
    this.selectedFacture = facture;
    this.openDetailsModal = true;
    this.cdr.markForCheck();
  }

  // --- ENREGISTRER UN PAIEMENT PAR TRANCHE ---
  openPayment(facture: any, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.selectedFacture = facture;
    const resteDu = Math.max(0, (facture.montantTotal || 0) - (facture.montantPaye || 0));
    
    const countPaiements = (facture.paiements?.length || 0) + 1;
    this.paiementForm = {
      montant: resteDu > 0 ? resteDu : 0,
      date: new Date().toISOString().split('T')[0],
      mode: 'Espèces',
      compteCaisse: 'Caisse principale',
      referenceRecu: `REC-${facture.reference}-0${countPaiements}`,
      agent: 'Ousmane Fall',
      note: resteDu > 0 ? `Règlement tranche ${countPaiements}` : 'Solde facture'
    };
    
    this.openPaiementModal = true;
    this.cdr.markForCheck();
  }

  submitPaiement(): void {
    if (!this.selectedFacture || this.paiementForm.montant <= 0) {
      alert("Veuillez saisir un montant de versement valide supérieur à 0.");
      return;
    }

    const resteDu = (this.selectedFacture.montantTotal || 0) - (this.selectedFacture.montantPaye || 0);
    if (this.paiementForm.montant > resteDu) {
      const confirmOver = confirm(`Le montant saisi (${this.formatMoney(this.paiementForm.montant)}) dépasse le reste dû (${this.formatMoney(resteDu)}). Souhaitez-vous continuer ?`);
      if (!confirmOver) return;
    }

    this.isSubmitting = true;
    this.cdr.markForCheck();

    const nouveauPaiement: TranchePaiement = {
      id: `TR-${Date.now()}`,
      date: this.paiementForm.date,
      montant: Number(this.paiementForm.montant),
      mode: this.paiementForm.mode,
      referenceRecu: this.paiementForm.referenceRecu || `REC-${this.selectedFacture.reference}`,
      compteCaisse: this.paiementForm.compteCaisse,
      agent: this.paiementForm.agent,
      note: this.paiementForm.note
    };

    const nouveauxPaiements = [...(this.selectedFacture.paiements || []), nouveauPaiement];
    const nouveauMontantPaye = (this.selectedFacture.montantPaye || 0) + nouveauPaiement.montant;
    
    let nouveauStatut = 'Partiellement payée';
    if (nouveauMontantPaye >= this.selectedFacture.montantTotal) {
      nouveauStatut = 'Payée';
    } else if (nouveauMontantPaye === 0) {
      nouveauStatut = 'Émise';
    }

    const updatedFacture = {
      ...this.selectedFacture,
      montantPaye: nouveauMontantPaye,
      statut: nouveauStatut,
      historiquePaiements: JSON.stringify(nouveauxPaiements)
    };

    // 1. Mise à jour de la facture
    this.commercialService.updateFacture(this.selectedFacture.id, updatedFacture).pipe(
      catchError(err => {
        console.error('Erreur mise à jour facture', err);
        return of(null);
      })
    ).subscribe(res => {
      // 2. Écriture automatique en trésorerie/caisse
      this.financeService.createTransaction({
        numero: `TR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        date: this.paiementForm.date,
        libelle: `Encaissement ${this.selectedFacture.reference} (${this.selectedFacture.clientNom}) - Tranche`,
        categorie: 'Recette Vente',
        centreCout: 'Transformation',
        sens: 'Recette',
        compte: this.paiementForm.compteCaisse,
        montant: nouveauPaiement.montant,
        responsable: this.paiementForm.agent,
        referenceDocument: this.selectedFacture.reference
      }).pipe(catchError(() => of(null))).subscribe();

      this.isSubmitting = false;
      this.openPaiementModal = false;
      
      if (this.selectedFacture) {
        this.selectedFacture.montantPaye = nouveauMontantPaye;
        this.selectedFacture.statut = nouveauStatut;
        this.selectedFacture.paiements = nouveauxPaiements;
      }

      this.showToast(`✓ Versement de ${this.formatMoney(nouveauPaiement.montant)} enregistré pour ${this.selectedFacture.reference} !`);
      this.loadData();
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  imprimerFacture(): void {
    window.print();
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount || 0);
  }

  getResteDu(facture: any): number {
    return Math.max(0, (facture.montantTotal || 0) - (facture.montantPaye || 0));
  }

  getProgressPercent(facture: any): number {
    if (!facture || !facture.montantTotal || facture.montantTotal === 0) return 100;
    return Math.min(100, Math.round(((facture.montantPaye || 0) / facture.montantTotal) * 100));
  }
}
