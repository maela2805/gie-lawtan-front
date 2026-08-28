import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StocksService } from '../services/stocks.service';
import { ApiService } from '../../../core/services/api.service';
import { catchError, forkJoin, of } from 'rxjs';
import { LucideAngularModule, Boxes, SlidersHorizontal, Search, CheckCircle2, AlertCircle, ArrowUpDown, Filter, RotateCcw } from 'lucide-angular';

import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-produits-finis',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './produits-finis.html',
  styleUrl: './produits-finis.scss',
})
export class ProduitsFinis implements OnInit {
  readonly Boxes = Boxes;
  readonly SlidersHorizontal = SlidersHorizontal;
  readonly Search = Search;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertCircle = AlertCircle;
  readonly ArrowUpDown = ArrowUpDown;
  readonly Filter = Filter;
  readonly RotateCcw = RotateCcw;

  produitsFinis: any[] = [];
  clients: any[] = [];

  currentPage = 1;
  pageSize = 8;

  isLoading = true;
  openAjustementModal = false;
  isSubmitting = false;

  searchTerm = '';
  
  // Sélecteurs déroulants pour les variétés de Riz et Sous-produits
  selectedRizVariete = 'TOUS';
  selectedSousProduit = 'TOUS';
  selectedBottes = 'TOUS';

  // Options pour le sélecteur Produits Finis (Riz)
  optionsRiz = [
    { value: 'TOUS', label: 'Tous les Produits Finis (Riz)' },
    { value: 'Riz entier', label: '🌾 Riz entier' },
    { value: 'Riz intermédiaire', label: '🌾 Riz intermédiaire' },
    { value: 'Riz brisé', label: '🌾 Riz brisé' },
    { value: 'Fine brisure', label: '🌾 Fine brisure' }
  ];

  // Options pour le sélecteur Sous-produits (Son & Balle)
  optionsSousProduits = [
    { value: 'TOUS', label: 'Tous les Sous-produits' },
    { value: 'Son de riz', label: '📦 Son de riz' },
    { value: 'Balle de riz', label: '📦 Balle de riz' }
  ];

  // Données modal ajustement
  selectedArticleForAjustement: any = null;
  ajustementData = {
    stockTheoriqueKg: 0,
    stockTheoriqueSacs: 0,
    stockReelSacs: 0,
    stockReelKg: 0,
    poidsParSac: 50,
    motif: 'Inventaire physique périodique'
  };

  constructor(
    private stocksService: StocksService,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      articles: this.stocksService.listArticles().pipe(catchError(() => of([]))),
      clients: this.api.get<any[]>('/commercial/clients').pipe(catchError(() => of([])))
    }).subscribe(({ articles, clients }) => {
      this.produitsFinis = (articles || []).filter(a => 
        a.categorie === "Produits finis" || 
        a.categorie === "Sous-produits" || 
        a.categorie === "Bottes de paille" ||
        a.designation?.toLowerCase().includes("riz") ||
        a.designation?.toLowerCase().includes("son") ||
        a.designation?.toLowerCase().includes("balle")
      );
      this.clients = clients || [];
      this.isLoading = false;
    });
  }

  onRizChange(): void {
    if (this.selectedRizVariete !== 'TOUS') {
      this.selectedSousProduit = 'TOUS';
    }
  }

  onSousProduitChange(): void {
    if (this.selectedSousProduit !== 'TOUS') {
      this.selectedRizVariete = 'TOUS';
    }
  }

  resetFilters(): void {
    this.selectedRizVariete = 'TOUS';
    this.selectedSousProduit = 'TOUS';
    this.searchTerm = '';
  }

  get filteredProduits(): any[] {
    return this.produitsFinis.filter(a => {
      // Filtre Riz
      let matchRiz = true;
      if (this.selectedRizVariete === 'ALL_RIZ') {
        matchRiz = a.categorie === 'Produits finis' || a.designation?.toLowerCase().includes('riz');
      } else if (this.selectedRizVariete !== 'TOUS') {
        matchRiz = a.designation?.toLowerCase().includes(this.selectedRizVariete.toLowerCase());
      }

      // Filtre Sous-produits
      let matchSousProduit = true;
      if (this.selectedSousProduit === 'ALL_SOUS') {
        matchSousProduit = a.categorie === 'Sous-produits' || a.designation?.toLowerCase().includes('son') || a.designation?.toLowerCase().includes('balle');
      } else if (this.selectedSousProduit !== 'TOUS') {
        matchSousProduit = a.designation?.toLowerCase().includes(this.selectedSousProduit.toLowerCase());
      }

      // Si un filtre spécifique est actif, on l'applique
      let matchCategory = true;
      if (this.selectedRizVariete !== 'TOUS') {
        matchCategory = matchRiz;
      } else if (this.selectedSousProduit !== 'TOUS') {
        matchCategory = matchSousProduit;
      }

      const matchSearch = !this.searchTerm ||
        a.designation?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        a.magasin?.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchCategory && matchSearch;
    });
  }

  get paginatedProduits(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredProduits.slice(start, start + this.pageSize);
  }

  getSacs(article: any): number {
    const poidsSac = article.designation?.includes('Botte') ? 1 : 50;
    return Number(((article.quantite || 0) / poidsSac).toFixed(1));
  }

  openAjustement(article: any): void {
    this.selectedArticleForAjustement = article;
    const poidsSac = article.designation?.includes('Botte') ? 1 : 50;
    const sacs = Number(((article.quantite || 0) / poidsSac).toFixed(1));

    this.ajustementData = {
      stockTheoriqueKg: article.quantite || 0,
      stockTheoriqueSacs: sacs,
      stockReelSacs: sacs,
      stockReelKg: article.quantite || 0,
      poidsParSac: poidsSac,
      motif: 'Inventaire physique de contrôle'
    };
    this.openAjustementModal = true;
  }

  onReelSacsChange(): void {
    this.ajustementData.stockReelKg = Number((this.ajustementData.stockReelSacs * this.ajustementData.poidsParSac).toFixed(2));
  }

  onReelKgChange(): void {
    this.ajustementData.stockReelSacs = Number((this.ajustementData.stockReelKg / this.ajustementData.poidsParSac).toFixed(1));
  }

  get ecartKg(): number {
    return Number((this.ajustementData.stockReelKg - this.ajustementData.stockTheoriqueKg).toFixed(2));
  }

  get ecartSacs(): number {
    return Number((this.ajustementData.stockReelSacs - this.ajustementData.stockTheoriqueSacs).toFixed(1));
  }

  validerAjustement(): void {
    if (!this.selectedArticleForAjustement) return;
    this.isSubmitting = true;

    this.selectedArticleForAjustement.quantite = this.ajustementData.stockReelKg;

    setTimeout(() => {
      alert(`Inventaire validé ! Stock de "${this.selectedArticleForAjustement.designation}" ajusté à ${this.ajustementData.stockReelSacs} sacs (${this.ajustementData.stockReelKg} kg). Écart : ${this.ecartKg > 0 ? '+' : ''}${this.ecartKg} kg.`);
      this.openAjustementModal = false;
      this.isSubmitting = false;
    }, 400);
  }
}
