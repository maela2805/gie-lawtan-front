import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StocksService } from '../services/stocks.service';
import { LucideAngularModule, Boxes, MapPin, ArrowRightLeft, Check, X } from 'lucide-angular';

import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-bottes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './bottes.html',
  styleUrl: './bottes.scss',
})
export class Bottes implements OnInit {
  readonly Boxes = Boxes;
  readonly MapPin = MapPin;
  readonly ArrowRightLeft = ArrowRightLeft;
  readonly Check = Check;
  readonly X = X;

  lieux: any[] = [
    { id: 1, nom: 'Dépôt Principal', type: 'Dépôt', responsable: 'Magasinier GIE', telephone: '77 123 45 67', quantite: 350 },
    { id: 2, nom: 'Parcelle Nord (Dagana)', type: 'Parcelle', responsable: 'Client Dagana', telephone: '76 902 11 47', quantite: 150 },
  ];

  transferts: any[] = [
    { id: 1, date: '2026-08-25', origine: 'Parcelle Nord (Dagana)', destination: 'Dépôt Principal', quantite: 100, responsable: 'Ibrahima Diallo' },
  ];

  currentPageTransferts = 1;
  pageSizeTransferts = 5;

  openLieu = false;
  openTransfert = false;
  toastMessage = '';

  formLieu = {
    nom: '',
    type: 'Dépôt',
    responsable: '',
    telephone: ''
  };

  formTransfert = {
    date: new Date().toISOString().split('T')[0],
    origineId: '',
    destinationId: '',
    quantite: 50,
    responsable: ''
  };

  constructor(
    private stocksService: StocksService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.cdr.markForCheck();
  }

  get totalGlobal(): number {
    return this.lieux.reduce((acc, curr) => acc + (curr.quantite || 0), 0);
  }

  get paginatedTransferts(): any[] {
    const start = (this.currentPageTransferts - 1) * this.pageSizeTransferts;
    return this.transferts.slice(start, start + this.pageSizeTransferts);
  }

  showToast(msg: string) {
    this.toastMessage = msg;
    this.cdr.markForCheck();
    setTimeout(() => {
      this.toastMessage = '';
      this.cdr.markForCheck();
    }, 4000);
  }

  handleCreateLieu(): void {
    const nouveau = {
      id: Date.now(),
      nom: this.formLieu.nom,
      type: this.formLieu.type,
      responsable: this.formLieu.responsable,
      telephone: this.formLieu.telephone,
      quantite: 0
    };
    this.lieux.push(nouveau);
    this.openLieu = false;
    this.showToast(`✓ Lieu de stockage "${nouveau.nom}" créé avec succès !`);
    this.formLieu = { nom: '', type: 'Dépôt', responsable: '', telephone: '' };
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  handleCreateTransfert(): void {
    const o = this.lieux.find(l => l.id == this.formTransfert.origineId);
    const d = this.lieux.find(l => l.id == this.formTransfert.destinationId);

    if (o && d && o.quantite >= this.formTransfert.quantite) {
      o.quantite -= this.formTransfert.quantite;
      d.quantite += this.formTransfert.quantite;

      this.transferts.unshift({
        id: Date.now(),
        date: this.formTransfert.date,
        origine: o.nom,
        destination: d.nom,
        quantite: this.formTransfert.quantite,
        responsable: this.formTransfert.responsable
      });

      this.openTransfert = false;
      this.showToast(`✓ Transfert de ${this.formTransfert.quantite} bottes effectué avec succès !`);
    } else {
      alert("Stock insuffisant dans le lieu d'origine ou destinations invalides");
    }
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }
}
