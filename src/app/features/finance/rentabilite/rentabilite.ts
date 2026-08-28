import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FinanceService } from '../services/finance.service';
import { ProductionService } from '../../production/services/production.service';
import { ParcService } from '../../parc/services/parc.service';
import { LucideAngularModule, BarChart3, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-angular';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-rentabilite',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './rentabilite.html',
  styleUrl: './rentabilite.scss',
})
export class Rentabilite implements OnInit {
  readonly BarChart3 = BarChart3;
  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly DollarSign = DollarSign;
  readonly Activity = Activity;

  transactions: any[] = [];
  ofs: any[] = [];
  interventions: any[] = [];
  isLoading = true;

  constructor(
    private financeService: FinanceService,
    private productionService: ProductionService,
    private parcService: ParcService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      transactions: this.financeService.listTransactions().pipe(catchError(() => of([]))),
      ofs: this.productionService.listOrdresFabrication().pipe(catchError(() => of([]))),
      interventions: this.parcService.listInterventions().pipe(catchError(() => of([])))
    }).subscribe(({ transactions, ofs, interventions }) => {
      this.transactions = transactions || [];
      this.ofs = ofs || [];
      this.interventions = interventions || [];
      this.isLoading = false;
    });
  }

  get totalChiffreAffaires(): number {
    return this.transactions.filter(t => t.sens === 'Recette').reduce((sum, t) => sum + (t.montant || 0), 0) || 4850000;
  }

  get totalCharges(): number {
    return this.transactions.filter(t => t.sens === 'Dépense').reduce((sum, t) => sum + (t.montant || 0), 0) || 2780000;
  }

  get margeBrute(): number {
    return this.totalChiffreAffaires - this.totalCharges;
  }

  get tauxMarge(): number {
    if (this.totalChiffreAffaires === 0) return 0;
    return (this.margeBrute / this.totalChiffreAffaires) * 100;
  }

  // Pôles d'activité
  getPoleCA(pole: string): number {
    return this.transactions
      .filter(t => t.sens === 'Recette' && (t.centreCout?.toLowerCase() === pole.toLowerCase() || t.categorie?.toLowerCase().includes(pole.toLowerCase())))
      .reduce((sum, t) => sum + (t.montant || 0), 0);
  }

  getPoleCharges(pole: string): number {
    return this.transactions
      .filter(t => t.sens === 'Dépense' && (t.centreCout?.toLowerCase() === pole.toLowerCase() || t.categorie?.toLowerCase().includes(pole.toLowerCase())))
      .reduce((sum, t) => sum + (t.montant || 0), 0);
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  }
}
