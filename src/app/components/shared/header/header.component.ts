import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../../../services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent {
  @Input() currentUser: User | null = null;
  @Output() toggleSidenav = new EventEmitter<void>();
  @Output() logout = new EventEmitter<void>();

  onToggleSidenav(): void {
    this.toggleSidenav.emit();
  }

  onLogout(): void {
    this.logout.emit();
  }

  get userDisplayName(): string {
    if (!this.currentUser) return '';
    return `${this.currentUser.prenom} ${this.currentUser.nom}`;
  }

  get userRoleDisplay(): string {
    if (!this.currentUser) return '';
    
    switch (this.currentUser.role) {
      case 'patient':
        return 'Patient';
      case 'medecin':
        return 'Médecin';
      case 'admin':
        return 'Administrateur';
      default:
        return this.currentUser.role;
    }
  }
}
