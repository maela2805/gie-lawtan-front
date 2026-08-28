import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductionService } from '../features/production/services/production.service';
import { StocksService } from '../features/stocks/services/stocks.service';
import { catchError, of, forkJoin, timeout } from 'rxjs';
import { LucideAngularModule, TrendingUp, Sparkles, Factory, Wheat, Tractor, ShieldAlert, CheckCircle2, ArrowUpRight, BarChart3, PackageCheck } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {
  readonly TrendingUp = TrendingUp;
  readonly Sparkles = Sparkles;
  readonly Factory = Factory;
  readonly Wheat = Wheat;
  readonly Tractor = Tractor;
  readonly ShieldAlert = ShieldAlert;
  readonly CheckCircle2 = CheckCircle2;
  readonly ArrowUpRight = ArrowUpRight;
  readonly BarChart3 = BarChart3;
  readonly PackageCheck = PackageCheck;

  machines: any[] = [];
  stocks: any[] = [];
  factures: any[] = [];
  ofs: any[] = [];
  
  caProduits = 4500000;
  caServices = 1250000;
  rendement = 83.2;
  alertes: any[] = [];
  
  isLoading = true;

  constructor(
    private productionService: ProductionService,
    private stocksService: StocksService
  ) {}

  ngOnInit(): void {
    forkJoin({
      stocks: this.stocksService.listArticles().pipe(
        timeout(5000),
        catchError(err => {
          console.error('Erreur chargement stocks', err);
          return of([]);
        })
      ),
      ofs: this.productionService.listOrdresFabrication().pipe(
        timeout(5000),
        catchError(err => {
          console.error('Erreur chargement production', err);
          return of([]);
        })
      )
    }).subscribe({
      next: ({ stocks, ofs }) => {
        this.stocks = stocks || [];
        this.alertes = this.stocks.filter(s => s.seuil !== undefined && s.quantite < s.seuil);
        
        this.ofs = ofs || [];
        const termines = this.ofs.filter(o => o.statut === 'Clôturé');
        if (termines.length > 0) {
          const totalRiz = termines.reduce((s, o) => s + ((o.resultats?.rizEntier || 0) + (o.resultats?.rizIntermediaire || 0) + (o.resultats?.rizBrise || 0) + (o.resultats?.fineBrisure || 0)), 0);
          const totalPaddy = termines.reduce((s, o) => s + (o.resultats?.paddyConsomme || 1), 0);
          this.rendement = (totalRiz / totalPaddy) * 100;
        }
        
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get totalStockPaddyKg(): number {
    return this.stocks
      .filter(s => s.categorie === 'Matières premières' || s.designation?.toLowerCase().includes('paddy'))
      .reduce((sum, s) => sum + (s.quantite || 0), 38400);
  }

  get totalProduitsFinisKg(): number {
    return this.stocks
      .filter(s => s.categorie === 'Produits finis' || s.designation?.toLowerCase().includes('riz'))
      .reduce((sum, s) => sum + (s.quantite || 0), 17300);
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(amount);
  }
}
