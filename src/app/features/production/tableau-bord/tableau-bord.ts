import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductionService } from '../services/production.service';
import { catchError, of } from 'rxjs';
import { LucideAngularModule, BarChart3, PieChart, Activity } from 'lucide-angular';

@Component({
  selector: 'app-tableau-bord',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './tableau-bord.html',
  styleUrl: './tableau-bord.scss',
})
export class TableauBord implements OnInit {
  readonly BarChart3 = BarChart3;
  readonly PieChart = PieChart;
  readonly Activity = Activity;

  ofClotures: any[] = [];
  isLoading = true;

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

  getTotalPaddy(): number {
    return this.ofClotures.reduce((acc, curr) => acc + (parseFloat(curr.resultats?.paddyConsomme) || 0), 0);
  }

  getTotalRizBlanc(): number {
    return this.ofClotures.reduce((acc, curr) => {
      const r = curr.resultats;
      const total = (parseFloat(r?.rizEntier) || 0) + (parseFloat(r?.rizIntermediaire) || 0) + (parseFloat(r?.rizBrise) || 0) + (parseFloat(r?.fineBrisure) || 0);
      return acc + total;
    }, 0);
  }

  parseVal(val: any): number {
    return parseFloat(val) || 0;
  }
}
