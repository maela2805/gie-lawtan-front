import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommercialService } from '../services/commercial.service';
import { LucideAngularModule, Users, Plus, Phone, MapPin, Search } from 'lucide-angular';
import { catchError, of } from 'rxjs';

import { PaginationComponent } from '../../../shared/pagination/pagination';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, PaginationComponent],
  templateUrl: './clients.html',
  styleUrl: './clients.scss',
})
export class Clients implements OnInit {
  readonly Users = Users;
  readonly Plus = Plus;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Search = Search;

  clients: any[] = [];

  currentPage = 1;
  pageSize = 8;

  isLoading = true;
  isSubmitting = false;
  openModal = false;
  searchTerm = '';
  selectedType = 'TOUS';

  types = ['TOUS', 'Producteur', 'Acheteur', 'Mixte'];

  formData = {
    code: '',
    nom: '',
    prenom: '',
    raisonSociale: '',
    type: 'Producteur',
    telephone: '',
    adresse: 'Dagana',
    nombreParcelles: 1,
    superficieExploitee: 5,
    encours: 0
  };

  constructor(private commercialService: CommercialService) {}

  ngOnInit(): void {
    this.loadClients();
  }

  loadClients(): void {
    this.isLoading = true;
    this.commercialService.listClients().pipe(
      catchError(err => {
        console.error('Erreur chargement clients', err);
        return of([]);
      })
    ).subscribe(data => {
      this.clients = data || [];
      this.isLoading = false;
    });
  }

  get filteredClients(): any[] {
    return this.clients.filter(c => {
      const matchType = this.selectedType === 'TOUS' || c.type === this.selectedType;
      const matchSearch = !this.searchTerm ||
        c.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.prenom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.code?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.telephone?.includes(this.searchTerm) ||
        c.adresse?.toLowerCase().includes(this.searchTerm.toLowerCase());
      return matchType && matchSearch;
    });
  }

  get paginatedClients(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredClients.slice(start, start + this.pageSize);
  }

  get totalClients(): number {
    return this.clients.length;
  }

  get producteurs(): number {
    return this.clients.filter(c => c.type === 'Producteur' || c.type === 'Mixte').length;
  }

  get acheteurs(): number {
    return this.clients.filter(c => c.type === 'Acheteur').length;
  }

  get totalEncours(): number {
    return this.clients.reduce((sum, c) => sum + (c.encours || 0), 0);
  }

  openCreateModal(): void {
    const code = `CL-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    this.formData = {
      code: code,
      nom: '',
      prenom: '',
      raisonSociale: '',
      type: 'Producteur',
      telephone: '+221 77 ',
      adresse: 'Dagana',
      nombreParcelles: 2,
      superficieExploitee: 5,
      encours: 0
    };
    this.openModal = true;
  }

  handleSubmit(): void {
    this.isSubmitting = true;
    this.commercialService.createClient(this.formData).pipe(
      catchError(err => {
        alert("Erreur lors de l'enregistrement du client");
        this.isSubmitting = false;
        return of(null);
      })
    ).subscribe(res => {
      if (res) {
        alert('Client / Producteur enregistré avec succès !');
        this.openModal = false;
        this.loadClients();
      }
      this.isSubmitting = false;
    });
  }

  formatMoney(amount: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(amount);
  }
}
