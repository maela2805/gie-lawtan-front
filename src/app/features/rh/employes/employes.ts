import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RhService } from '../services/rh.service';
import { LucideAngularModule, HardHat, Plus, Phone, Search, Users, Check, X } from 'lucide-angular';
import { catchError, of } from 'rxjs';

import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-employes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './employes.html',
  styleUrl: './employes.scss',
})
export class Employes implements OnInit {
  readonly HardHat = HardHat;
  readonly Plus = Plus;
  readonly Phone = Phone;
  readonly Search = Search;
  readonly Users = Users;
  readonly Check = Check;
  readonly X = X;

  employes: any[] = [];

  currentPage = 1;
  pageSize = 8;

  isLoading = true;
  isSubmitting = false;
  openModal = false;
  searchTerm = '';
  selectedCategorie = 'TOUTES';
  toastMessage = '';

  categories = ['TOUTES', 'Usine', 'Botte', 'Tracteur', 'Moissonneuse'];

  formData = {
    matricule: '',
    nom: '',
    prenom: '',
    categorie: 'Usine',
    fonction: 'Opérateur usine',
    telephone: '+221 77 ',
    modeRemuneration: 'Journalier',
    salaireBase: 4000
  };

  constructor(
    private rhService: RhService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEmployes();
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.markForCheck();
    }, 4000);
  }

  loadEmployes(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.rhService.listEmployes().pipe(
      catchError(err => {
        console.error('Erreur chargement employés', err);
        return of([]);
      })
    ).subscribe(data => {
      this.employes = data || [];
      this.isLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  get filteredEmployes(): any[] {
    return this.employes.filter(e => {
      const matchCat = this.selectedCategorie === 'TOUTES' || e.categorie === this.selectedCategorie;
      const matchSearch = !this.searchTerm ||
        e.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        e.prenom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        e.matricule?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        e.fonction?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        e.telephone?.includes(this.searchTerm);
      return matchCat && matchSearch;
    });
  }

  get paginatedEmployes(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredEmployes.slice(start, start + this.pageSize);
  }

  get totalEmployes(): number {
    return this.employes.length;
  }

  get permanents(): number {
    return this.employes.filter(e => e.modeRemuneration === 'Mensuel' || e.categorie === 'Permanent').length;
  }

  get journaliers(): number {
    return this.employes.filter(e => e.modeRemuneration === 'Journalier' || e.categorie !== 'Permanent').length;
  }

  get totalMasseSalariale(): number {
    return this.employes.reduce((sum, e) => {
      if (e.modeRemuneration === 'Mensuel') return sum + (e.salaireBase || 0);
      if (e.modeRemuneration === 'Journalier') return sum + ((e.salaireBase || 0) * 26);
      return sum + (e.salaireBase || 0);
    }, 0);
  }

  openCreateModal(): void {
    const mat = `EMP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    this.formData = {
      matricule: mat,
      nom: '',
      prenom: '',
      categorie: 'Usine',
      fonction: 'Opérateur usine',
      telephone: '+221 77 ',
      modeRemuneration: 'Journalier',
      salaireBase: 4000
    };
    this.openModal = true;
    this.cdr.markForCheck();
  }

  onCategorieChange(): void {
    if (this.formData.categorie === 'Usine') {
      this.formData.fonction = 'Opérateur usine';
      this.formData.salaireBase = 4000;
    } else if (this.formData.categorie === 'Botte') {
      this.formData.fonction = 'Opérateur presse à paille';
      this.formData.salaireBase = 4500;
    } else if (this.formData.categorie === 'Tracteur') {
      this.formData.fonction = 'Chauffeur tracteur';
      this.formData.salaireBase = 5500;
    } else if (this.formData.categorie === 'Moissonneuse') {
      this.formData.fonction = 'Conducteur moissonneuse';
      this.formData.salaireBase = 6000;
    }
  }

  handleSubmit(): void {
    this.isSubmitting = true;
    this.rhService.createEmploye(this.formData).pipe(
      catchError(err => {
        alert("Erreur lors de l'enregistrement de l'employé");
        this.isSubmitting = false;
        this.cdr.markForCheck();
        return of(null);
      })
    ).subscribe(res => {
      this.openModal = false;
      this.isSubmitting = false;
      if (res) {
        this.showToast(`✓ Collaborateur ${this.formData.prenom} ${this.formData.nom} enregistré !`);
        this.loadEmployes();
      }
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  }
}
