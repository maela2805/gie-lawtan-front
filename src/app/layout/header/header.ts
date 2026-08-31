import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth';
import { LucideAngularModule, LUCIDE_ICONS, LucideIconProvider, Menu, Bell, UserRound, LogOut, Sparkles, ShieldCheck } from 'lucide-angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule, 
    LucideAngularModule
  ],
  providers: [
    {
      provide: LUCIDE_ICONS,
      multi: true,
      useValue: new LucideIconProvider({ Menu, Bell, UserRound, LogOut, Sparkles, ShieldCheck })
    }
  ],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  readonly Menu = Menu;
  readonly Bell = Bell;
  readonly UserRound = UserRound;
  readonly LogOut = LogOut;
  readonly Sparkles = Sparkles;
  readonly ShieldCheck = ShieldCheck;

  @Output() toggleSidebar = new EventEmitter<void>();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  logout() {
    if (confirm('Voulez-vous vraiment vous déconnecter ?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}
