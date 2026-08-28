import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AchatsService } from '../services/achats.service';
import { LucideAngularModule, Truck, Plus, Phone, MapPin, Search } from 'lucide-angular';
import { catchError, of } from 'rxjs';

import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-fournisseurs',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './fournisseurs.html',
  styleUrl: './fournisseurs.scss',
})
export class Fournisseurs implements OnInit {
  readonly Truck = Truck;
  readonly Plus = Plus;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Search = Search;

  fournisseurs: any[] = [];

  currentPage = 1;
  pageSize = 8;

  isLoading = true;
  isSubmitting = false;
  openModal = false;
  searchTerm = '';
  selectedCategorie = 'TOUTES';

  categories = ['TOUTES', 'Carburant', 'Sacs & Conditionnement', 'Pièces & Maintenance', 'Intrants', 'Autre'];

  formData = {
    code: '',
    nom: '',
    categorie: 'Carburant',
    telephone: '+221 33 ',
    adresse: 'Dagana',
    soldeDu: 0
  };

  constructor(private achatsService: AchatsService) {}

  ngOnInit(): void {
    this.loadFournisseurs();
  }

  loadFournisseurs(): void {
    this.isLoading = true;
    this.achatsService.listFournisseurs().pipe(
      catchError(err => {
        console.error('Erreur chargement fournisseurs', err);
        return of([]);
      })
    ).subscribe(data => {
      this.fournisseurs = data || [];
      this.isLoading = false;
    });
  }

  get filteredFournisseurs(): any[] {
    return this.fournisseurs.filter(f => {
      const matchCat = this.selectedCategorie === 'TOUTES' || f.categorie === this.selectedCategorie;
      const matchSearch = !this.searchTerm ||
        f.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        f.code?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        f.telephone?.includes(this.searchTerm) ||
        f.adresse?.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  get paginatedFournisseurs(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredFournisseurs.slice(start, start + this.pageSize);
  }

  get totalFournisseurs(): number {
    return this.fournisseurs.length;
  }

  get totalDettes(): number {
    return this.fournisseurs.reduce((sum, f) => sum + (f.soldeDu || 0), 0);
  }

  openCreateModal(): void {
    const code = `FOUR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    this.formData = {
      code: code,
      nom: '',
      categorie: 'Carburant',
      telephone: '+221 33 ',
      adresse: 'Dagana',
      soldeDu: 0
    };
    this.openModal = true;
  }

  handleSubmit(): void {
    this.isSubmitting = true;
    this.achatsService.createFournisseur(this.formData).pipe(
      catchError(err => {
        alert("Erreur lors de l'enregistrement du fournisseur");
        this.isSubmitting = false;
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        alert('Fournisseur enregistré avec succès !');
        this.openModal = false;
        this.loadFournisseurs();
      }
      this.isSubmitting = false;
    });
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  }
}
