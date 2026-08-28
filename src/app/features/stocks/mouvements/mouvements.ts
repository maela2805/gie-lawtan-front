import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StocksService } from '../services/stocks.service';
import { catchError, of } from 'rxjs';
import { LucideAngularModule, History, ArrowRightLeft, Calendar, Filter, Search, RotateCcw, ArrowDownLeft, ArrowUpRight } from 'lucide-angular';

import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-mouvements',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './mouvements.html',
  styleUrl: './mouvements.scss',
})
export class Mouvements implements OnInit {
  readonly History = History;
  readonly ArrowRightLeft = ArrowRightLeft;
  readonly Calendar = Calendar;
  readonly Filter = Filter;
  readonly Search = Search;
  readonly RotateCcw = RotateCcw;
  readonly ArrowDownLeft = ArrowDownLeft;
  readonly ArrowUpRight = ArrowUpRight;

  mouvements: any[] = [];
  isLoading = true;

  // Filtres
  selectedType: 'TOUS' | 'Entrée' | 'Sortie' = 'TOUS';
  dateDebut: string = '';
  dateFin: string = '';
  searchTerm: string = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;

  constructor(
    private stocksService: StocksService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    this.stocksService.listMouvements().pipe(
      catchError(err => {
        console.error('Erreur', err);
        return of([]);
      })
    ).subscribe(data => {
      this.mouvements = data || [];
      this.isLoading = false;
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  resetFilters(): void {
    this.selectedType = 'TOUS';
    this.dateDebut = '';
    this.dateFin = '';
    this.searchTerm = '';
    this.currentPage = 1;
    this.cdr.markForCheck();
  }

  get filteredMouvements(): any[] {
    return this.mouvements.filter(mvt => {
      // 1. Filtre par Type (Entrée / Sortie)
      if (this.selectedType !== 'TOUS') {
        if (this.selectedType === 'Entrée' && mvt.type !== 'Entrée') return false;
        if (this.selectedType === 'Sortie' && mvt.type === 'Entrée') return false;
      }

      // 2. Filtre par Durée (Date Début & Date Fin)
      if (this.dateDebut && mvt.date && mvt.date < this.dateDebut) {
        return false;
      }
      if (this.dateFin && mvt.date && mvt.date > this.dateFin) {
        return false;
      }

      // 3. Filtre par Recherche texte
      if (this.searchTerm) {
        const q = this.searchTerm.toLowerCase();
        const matchSearch =
          mvt.numero?.toLowerCase().includes(q) ||
          mvt.article?.toLowerCase().includes(q) ||
          mvt.origine?.toLowerCase().includes(q) ||
          mvt.destination?.toLowerCase().includes(q) ||
          mvt.referenceDocument?.toLowerCase().includes(q) ||
          mvt.utilisateur?.toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      return true;
    });
  }

  get paginatedMouvements(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredMouvements.slice(start, start + this.pageSize);
  }

  get countEntrees(): number {
    return this.filteredMouvements.filter(m => m.type === 'Entrée').length;
  }

  get countSorties(): number {
    return this.filteredMouvements.filter(m => m.type !== 'Entrée').length;
  }

  get isFiltered(): boolean {
    return this.selectedType !== 'TOUS' || !!this.dateDebut || !!this.dateFin || !!this.searchTerm;
  }
}
