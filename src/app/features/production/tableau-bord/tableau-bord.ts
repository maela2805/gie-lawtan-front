import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductionService } from '../services/production.service';
import { catchError, of } from 'rxjs';
import { LucideAngularModule, BarChart3, PieChart, Activity, CalendarDays, Search, RotateCcw, Filter } from 'lucide-angular';
import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-tableau-bord',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './tableau-bord.html',
  styleUrl: './tableau-bord.scss',
})
export class TableauBord implements OnInit {
  readonly BarChart3 = BarChart3;
  readonly PieChart = PieChart;
  readonly Activity = Activity;
  readonly CalendarDays = CalendarDays;
  readonly Search = Search;
  readonly RotateCcw = RotateCcw;
  readonly Filter = Filter;

  ofClotures: any[] = [];
  isLoading = true;

  // Filtres
  dateDebut: string = '';
  dateFin: string = '';
  searchTerm: string = '';

  // Pagination
  currentPage = 1;
  pageSize = 10;

  constructor(private productionService: ProductionService) {}

  ngOnInit(): void {
    this.productionService.listOrdresFabrication().pipe(
      catchError(err => {
        console.error(err);
        return of([]);
      })
    ).subscribe(data => {
      this.ofClotures = data?.filter(of => of.statut === "Clôturé" && of.resultats) || [];
      this.isLoading = false;
    });
  }

  get filteredOfClotures(): any[] {
    return this.ofClotures.filter(item => {
      // Filtre Date Début
      if (this.dateDebut && item.date && item.date < this.dateDebut) {
        return false;
      }
      // Filtre Date Fin
      if (this.dateFin && item.date && item.date > this.dateFin) {
        return false;
      }
      // Filtre Recherche
      if (this.searchTerm) {
        const term = this.searchTerm.toLowerCase();
        const num = (item.numero || '').toLowerCase();
        const client = (item.clientNom || '').toLowerCase();
        return num.includes(term) || client.includes(term);
      }
      return true;
    });
  }

  get paginatedOfClotures(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    return this.filteredOfClotures.slice(startIndex, startIndex + this.pageSize);
  }

  resetFilters(): void {
    this.dateDebut = '';
    this.dateFin = '';
    this.searchTerm = '';
    this.currentPage = 1;
  }

  getTotalPaddy(): number {
    return this.filteredOfClotures.reduce((acc, curr) => acc + (parseFloat(curr.resultats?.paddyConsomme) || 0), 0);
  }

  getTotalRizBlanc(): number {
    return this.filteredOfClotures.reduce((acc, curr) => {
      const r = curr.resultats;
      const total = (parseFloat(r?.rizEntier) || 0) + (parseFloat(r?.rizIntermediaire) || 0) + (parseFloat(r?.rizBrise) || 0) + (parseFloat(r?.fineBrisure) || 0);
      return acc + total;
    }, 0);
  }

  parseVal(val: any): number {
    return parseFloat(val) || 0;
  }
}
