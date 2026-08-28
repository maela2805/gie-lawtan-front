import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../services/finance.service';
import { LucideAngularModule, Wallet, Plus, ArrowUpRight, ArrowDownLeft, Search } from 'lucide-angular';
import { catchError, forkJoin, of } from 'rxjs';

import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-caisse',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './caisse.html',
  styleUrl: './caisse.scss',
})
export class Caisse implements OnInit {
  readonly Wallet = Wallet;
  readonly Plus = Plus;
  readonly ArrowUpRight = ArrowUpRight;
  readonly ArrowDownLeft = ArrowDownLeft;
  readonly Search = Search;

  transactions: any[] = [];
  soldes: any = {
    caissePrincipale: 0,
    caisseProduction: 0,
    caissePrestations: 0,
    banque: 0
  };

  currentPage = 1;
  pageSize = 8;

  isLoading = true;
  isSubmitting = false;
  openModal = false;
  searchTerm = '';
  selectedCompte = 'TOUS';
  selectedSens = 'TOUS';

  comptes = ['TOUS', 'Caisse principale', 'Caisse production', 'Caisse prestations', 'Banque'];

  formData = {
    numero: '',
    date: new Date().toISOString().split('T')[0],
    libelle: '',
    categorie: 'Recette Vente',
    centreCout: 'Transformation',
    sens: 'Recette',
    compte: 'Caisse principale',
    montant: 50000,
    responsable: 'Ousmane Fall',
    referenceDocument: ''
  };

  constructor(private financeService: FinanceService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      transactions: this.financeService.listTransactions().pipe(catchError(() => of([]))),
      soldes: this.financeService.getSoldes().pipe(catchError(() => of({})))
    }).subscribe(({ transactions, soldes }) => {
      this.transactions = transactions || [];
      this.soldes = soldes || { caissePrincipale: 0, caisseProduction: 0, caissePrestations: 0, banque: 0 };
      this.isLoading = false;
    });
  }

  get filteredTransactions(): any[] {
    return this.transactions.filter(t => {
      const matchCompte = this.selectedCompte === 'TOUS' || t.compte === this.selectedCompte;
      const matchSens = this.selectedSens === 'TOUS' || t.sens === this.selectedSens;
      const matchSearch = !this.searchTerm ||
        t.libelle?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        t.numero?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        t.responsable?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        t.referenceDocument?.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchCompte && matchSens && matchSearch;
    });
  }

  get paginatedTransactions(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredTransactions.slice(start, start + this.pageSize);
  }

  get soldeGlobal(): number {
    return (this.soldes.caissePrincipale || 0) + 
           (this.soldes.caisseProduction || 0) + 
           (this.soldes.caissePrestations || 0) + 
           (this.soldes.banque || 0);
  }

  get totalRecettes(): number {
    return this.transactions.filter(t => t.sens === 'Recette').reduce((sum, t) => sum + (t.montant || 0), 0);
  }

  get totalDepenses(): number {
    return this.transactions.filter(t => t.sens === 'Dépense').reduce((sum, t) => sum + (t.montant || 0), 0);
  }

  openCreateModal(): void {
    const num = `TR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    this.formData = {
      numero: num,
      date: new Date().toISOString().split('T')[0],
      libelle: '',
      categorie: 'Recette Vente',
      centreCout: 'Transformation',
      sens: 'Recette',
      compte: 'Caisse principale',
      montant: 50000,
      responsable: 'Ousmane Fall',
      referenceDocument: ''
    };
    this.openModal = true;
  }

  handleSubmit(): void {
    this.isSubmitting = true;
    this.financeService.createTransaction(this.formData).pipe(
      catchError(err => {
        alert("Erreur lors de l'enregistrement du flux financier");
        this.isSubmitting = false;
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        alert('Écriture financière enregistrée avec succès !');
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
