import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AchatsService } from '../services/achats.service';
import { LucideAngularModule, ShoppingCart, Plus, CheckCircle2, Clock, Search } from 'lucide-angular';
import { catchError, forkJoin, of } from 'rxjs';

import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-commandes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './commandes.html',
  styleUrl: './commandes.scss',
})
export class Commandes implements OnInit {
  readonly ShoppingCart = ShoppingCart;
  readonly Plus = Plus;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly Search = Search;

  commandes: any[] = [];
  fournisseurs: any[] = [];

  currentPage = 1;
  pageSize = 8;

  isLoading = true;
  isSubmitting = false;
  openModal = false;
  searchTerm = '';
  selectedStatut = 'TOUS';

  statuts = ['TOUS', 'En attente', 'Livrée', 'Payée'];

  formData = {
    numero: '',
    fournisseurId: '',
    fournisseurNom: '',
    date: new Date().toISOString().split('T')[0],
    designation: '',
    categorie: 'Carburant',
    montantTotal: 500000,
    montantPaye: 0,
    statut: 'En attente'
  };

  constructor(private achatsService: AchatsService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      commandes: this.achatsService.listCommandes().pipe(catchError(() => of([]))),
      fournisseurs: this.achatsService.listFournisseurs().pipe(catchError(() => of([])))
    }).subscribe(({ commandes, fournisseurs }) => {
      this.commandes = commandes || [];
      this.fournisseurs = fournisseurs || [];
      this.isLoading = false;
    });
  }

  get filteredCommandes(): any[] {
    return this.commandes.filter(c => {
      const matchStatut = this.selectedStatut === 'TOUS' || c.statut === this.selectedStatut;
      const matchSearch = !this.searchTerm ||
        c.numero?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.fournisseurNom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.designation?.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchStatut && matchSearch;
    });
  }

  get paginatedCommandes(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredCommandes.slice(start, start + this.pageSize);
  }

  get totalCommandes(): number {
    return this.commandes.length;
  }

  get totalMontant(): number {
    return this.commandes.reduce((sum, c) => sum + (c.montantTotal || 0), 0);
  }

  get totalPaye(): number {
    return this.commandes.reduce((sum, c) => sum + (c.montantPaye || 0), 0);
  }

  openCreateModal(): void {
    const num = `BC-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    this.formData = {
      numero: num,
      fournisseurId: this.fournisseurs[0]?.id || '',
      fournisseurNom: this.fournisseurs[0]?.nom || '',
      date: new Date().toISOString().split('T')[0],
      designation: 'Achat consommables & fournitures',
      categorie: 'Carburant',
      montantTotal: 500000,
      montantPaye: 0,
      statut: 'En attente'
    };
    this.openModal = true;
  }

  handleSubmit(): void {
    this.isSubmitting = true;
    const f = this.fournisseurs.find(fourn => fourn.id == this.formData.fournisseurId);

    const payload = {
      ...this.formData,
      fournisseurNom: f?.nom || this.formData.fournisseurNom
    };

    this.achatsService.createCommande(payload).pipe(
      catchError(err => {
        alert("Erreur lors de la création de la commande");
        this.isSubmitting = false;
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        alert('Bon de commande enregistré avec succès !');
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
