import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommercialService } from '../services/commercial.service';
import { LucideAngularModule, Tags, Plus, Search, CheckCircle2 } from 'lucide-angular';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './catalogue.html',
  styleUrl: './catalogue.scss',
})
export class Catalogue implements OnInit {
  readonly Tags = Tags;
  readonly Plus = Plus;
  readonly Search = Search;
  readonly CheckCircle2 = CheckCircle2;

  items: any[] = [];
  isLoading = true;
  isSubmitting = false;
  openModal = false;
  searchTerm = '';
  selectedFamille = 'TOUTES';

  familles = ['TOUTES', 'Riz blanc', 'Sous-produits', 'Production secondaire', 'Prestations agricoles'];

  formData = {
    designation: '',
    famille: 'Riz blanc',
    nature: 'Produit',
    prixIndicatif: 12500,
    unite: 'Sac 25 kg'
  };

  constructor(private commercialService: CommercialService) {}

  ngOnInit(): void {
    this.loadCatalogue();
  }

  loadCatalogue(): void {
    this.isLoading = true;
    this.commercialService.listCatalogue().pipe(
      catchError(err => {
        console.error('Erreur chargement catalogue', err);
        return of([]);
      })
    ).subscribe(data => {
      this.items = data || [];
      this.isLoading = false;
    });
  }

  get filteredItems(): any[] {
    return this.items.filter(item => {
      const matchFamille = this.selectedFamille === 'TOUTES' || item.famille === this.selectedFamille;
      const matchSearch = !this.searchTerm ||
        item.designation?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.famille?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        item.unite?.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchFamille && matchSearch;
    });
  }

  get totalItems(): number {
    return this.items.length;
  }

  get totalProduits(): number {
    return this.items.filter(i => i.nature === 'Produit').length;
  }

  get totalServices(): number {
    return this.items.filter(i => i.nature === 'Service').length;
  }

  openCreateModal(): void {
    this.formData = {
      designation: '',
      famille: 'Riz blanc',
      nature: 'Produit',
      prixIndicatif: 12500,
      unite: 'Sac 25 kg'
    };
    this.openModal = true;
  }

  onFamilleChange(): void {
    if (this.formData.famille === 'Prestations agricoles') {
      this.formData.nature = 'Service';
      this.formData.unite = 'Hectare';
      this.formData.prixIndicatif = 35000;
    } else {
      this.formData.nature = 'Produit';
      if (this.formData.famille === 'Riz blanc') {
        this.formData.unite = 'Sac 25 kg';
        this.formData.prixIndicatif = 12500;
      } else if (this.formData.famille === 'Production secondaire') {
        this.formData.unite = 'Botte';
        this.formData.prixIndicatif = 700;
      } else {
        this.formData.unite = 'Sac 50 kg';
        this.formData.prixIndicatif = 4500;
      }
    }
  }

  handleSubmit(): void {
    this.isSubmitting = true;
    this.commercialService.createCatalogueItem(this.formData).pipe(
      catchError(err => {
        alert("Erreur lors de l'ajout au catalogue");
        this.isSubmitting = false;
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        alert('Article / Tarif ajouté au catalogue avec succès !');
        this.openModal = false;
        this.loadCatalogue();
      }
      this.isSubmitting = false;
    });
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  }
}
