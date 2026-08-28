import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ParcService } from '../services/parc.service';
import { LucideAngularModule, Tractor, Plus, Wrench, CheckCircle2, AlertTriangle, Search, Check, X } from 'lucide-angular';
import { catchError, of } from 'rxjs';

import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-machines',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './machines.html',
  styleUrl: './machines.scss',
})
export class Machines implements OnInit {
  readonly Tractor = Tractor;
  readonly Plus = Plus;
  readonly Wrench = Wrench;
  readonly CheckCircle2 = CheckCircle2;
  readonly AlertTriangle = AlertTriangle;
  readonly Search = Search;
  readonly Check = Check;
  readonly X = X;

  machines: any[] = [];

  currentPage = 1;
  pageSize = 8;

  isLoading = true;
  isSubmitting = false;
  openModal = false;
  searchTerm = '';
  selectedCategory = 'TOUTES';
  toastMessage = '';

  categories = ['TOUTES', 'Tracteur', 'Moissonneuse', 'Presse', 'Décortiqueuse', 'Autre'];

  formData = {
    numeroInventaire: '',
    codeInterne: '',
    designation: '',
    categorie: 'Tracteur',
    marque: '',
    modele: '',
    statut: 'Disponible',
    compteurHoraire: 0,
    prochaineMaintenance: 250
  };

  constructor(
    private parcService: ParcService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMachines();
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.markForCheck();
    }, 4000);
  }

  loadMachines(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.parcService.listMachines().pipe(
      catchError(err => {
        console.error('Erreur chargement machines', err);
        return of([]);
      })
    ).subscribe(data => {
      this.machines = data || [];
      this.isLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  get filteredMachines(): any[] {
    return this.machines.filter(m => {
      const matchCat = this.selectedCategory === 'TOUTES' || m.categorie === this.selectedCategory;
      const matchSearch = !this.searchTerm || 
        m.designation?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        m.codeInterne?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        m.numeroInventaire?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        m.marque?.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }

  get paginatedMachines(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredMachines.slice(start, start + this.pageSize);
  }

  get totalMachines(): number {
    return this.machines.length;
  }

  get disponibles(): number {
    return this.machines.filter(m => m.statut === 'Disponible').length;
  }

  get enActivite(): number {
    return this.machines.filter(m => m.statut === 'En prestation' || m.statut === 'En production').length;
  }

  get enAlerte(): number {
    return this.machines.filter(m => m.statut === 'En maintenance' || m.statut === 'En panne').length;
  }

  openCreateModal(): void {
    const nextNum = `EQ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    this.formData = {
      numeroInventaire: nextNum,
      codeInterne: `M-${Math.floor(10 + Math.random() * 90)}`,
      designation: '',
      categorie: 'Tracteur',
      marque: '',
      modele: '',
      statut: 'Disponible',
      compteurHoraire: 0,
      prochaineMaintenance: 250
    };
    this.openModal = true;
    this.cdr.markForCheck();
  }

  handleSubmit(): void {
    this.isSubmitting = true;
    this.parcService.createMachine(this.formData).pipe(
      catchError(err => {
        alert('Erreur lors de la création de la machine');
        this.isSubmitting = false;
        this.cdr.markForCheck();
        return of(null);
      })
    ).subscribe(res => {
      this.openModal = false;
      this.isSubmitting = false;
      if (res) {
        this.showToast(`✓ Machine ${this.formData.designation} enregistrée !`);
        this.loadMachines();
      }
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }
}
