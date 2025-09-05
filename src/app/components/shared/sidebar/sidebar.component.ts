// src/app/components/shared/sidebar/sidebar.component.ts
import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { User } from '../../../services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  roles: string[];
}

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Input() currentUser: User | null = null;

  menuItems: MenuItem[] = [
    // Menu Patient
    {
      label: 'Tableau de bord',
      icon: 'dashboard',
      route: '/dashboard/patient',
      roles: ['patient']
    },
    {
      label: 'Rechercher un médecin',
      icon: 'search',
      route: '/dashboard/patient/medecins',
      roles: ['patient']
    },
    {
      label: 'Mes rendez-vous',
      icon: 'event',
      route: '/dashboard/patient/rendez-vous',
      roles: ['patient']
    },
    {
      label: 'Mon profil',
      icon: 'person',
      route: '/dashboard/patient/profil',
      roles: ['patient']
    },
    
    // Menu Médecin
    {
      label: 'Tableau de bord',
      icon: 'dashboard',
      route: '/dashboard/medecin',
      roles: ['medecin']
    },
    {
      label: 'Mes rendez-vous',
      icon: 'event',
      route: '/dashboard/medecin/rendez-vous',
      roles: ['medecin']
    },
    {
      label: 'Horaires',
      icon: 'schedule',
      route: '/dashboard/medecin/horaires',
      roles: ['medecin']
    },
    {
      label: 'Mon profil',
      icon: 'person',
      route: '/dashboard/medecin/profil',
      roles: ['medecin']
    },
    
    // Menu Admin
    {
      label: 'Tableau de bord',
      icon: 'dashboard',
      route: '/dashboard/admin',
      roles: ['admin']
    },
    {
      label: 'Utilisateurs',
      icon: 'people',
      route: '/dashboard/admin/utilisateurs',
      roles: ['admin']
    },
    {
      label: 'Spécialités',
      icon: 'medical_services',
      route: '/dashboard/admin/specialites',
      roles: ['admin']
    },
    {
      label: 'Statistiques',
      icon: 'analytics',
      route: '/dashboard/admin/statistiques',
      roles: ['admin']
    }
  ];

  constructor(private router: Router) {}

  get filteredMenuItems(): MenuItem[] {
    if (!this.currentUser) return [];
    
    return this.menuItems.filter(item => 
      item.roles.includes(this.currentUser!.role)
    );
  }

  isActive(route: string): boolean {
    return this.router.url === route;
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }


getRoleDisplayName(): string {
  if (!this.currentUser) return '';
  
  switch (this.currentUser.role) {
    case 'patient':
      return 'Patient';
    case 'medecin':
      return 'Médecin';
    case 'admin':
      return 'Admin';
    default:
      return this.currentUser.role;
  }
}

}



