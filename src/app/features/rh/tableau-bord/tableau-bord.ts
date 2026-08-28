import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RhService } from '../services/rh.service';
import { LucideAngularModule, BarChart3, Users, Clock, Wallet, HardHat } from 'lucide-angular';
import { catchError, forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-rh-tableau-bord',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './tableau-bord.html',
  styleUrl: './tableau-bord.scss',
})
export class TableauBord implements OnInit {
  readonly BarChart3 = BarChart3;
  readonly Users = Users;
  readonly Clock = Clock;
  readonly Wallet = Wallet;
  readonly HardHat = HardHat;

  employes: any[] = [];
  pointages: any[] = [];
  isLoading = true;

  constructor(private rhService: RhService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    forkJoin({
      employes: this.rhService.listEmployes().pipe(catchError(() => of([]))),
      pointages: this.rhService.listPointages().pipe(catchError(() => of([])))
    }).subscribe(({ employes, pointages }) => {
      this.employes = employes || [];
      this.pointages = pointages || [];
      this.isLoading = false;
    });
  }

  get totalEmployes(): number {
    return this.employes.length;
  }

  get totalHeures(): number {
    return this.pointages.reduce((sum, p) => sum + (p.heuresTravaillees || 0), 0);
  }

  get totalCoutPointages(): number {
    return this.pointages.reduce((sum, p) => sum + (p.coutMainOeuvre || 0), 0);
  }

  get masseSalarialeBase(): number {
    return this.employes.reduce((sum, e) => {
      if (e.modeRemuneration === 'Mensuel') return sum + (e.salaireBase || 0);
      if (e.modeRemuneration === 'Journalier') return sum + ((e.salaireBase || 0) * 26);
      return sum + (e.salaireBase || 0);
    }, 0);
  }

  getRepartition(activite: string): number {
    const total = this.pointages.length;
    if (total === 0) return 0;
    const count = this.pointages.filter(p => p.activite?.toLowerCase().includes(activite.toLowerCase())).length;
    return Math.round((count / total) * 100);
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  }
}
