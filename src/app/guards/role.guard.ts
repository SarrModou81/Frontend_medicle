import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    console.log('👤 RoleGuard - Vérification rôle pour:', state.url);
    
    // Vérifier si l'utilisateur est authentifié
    if (!this.authService.isAuthenticated()) {
      console.log('❌ RoleGuard - Utilisateur non authentifié');
      this.router.navigate(['/login']);
      return false;
    }

    // Récupérer les rôles attendus depuis les données de la route
    const expectedRoles = route.data['expectedRoles'] as string[];
    const currentUser = this.authService.getCurrentUser();
    
    console.log('👤 RoleGuard - Rôles attendus:', expectedRoles);
    console.log('👤 RoleGuard - Utilisateur actuel:', currentUser);
    console.log('👤 RoleGuard - Rôle utilisateur:', currentUser?.role);
    
    if (expectedRoles && expectedRoles.length > 0) {
      // Vérifier si l'utilisateur a l'un des rôles requis
      const hasValidRole = this.authService.hasAnyRole(expectedRoles);
      console.log('👤 RoleGuard - A un rôle valide:', hasValidRole);
      
      if (hasValidRole) {
        console.log('✅ RoleGuard - Accès autorisé');
        return true;
      } else {
        console.log('❌ RoleGuard - Rôle insuffisant, redirection...');
        
        // Rediriger vers le dashboard approprié selon le rôle
        if (currentUser) {
          switch (currentUser.role) {
            case 'patient':
              console.log('👤 RoleGuard - Redirection vers patient dashboard');
              this.router.navigate(['/dashboard/patient']);
              break;
            case 'medecin':
              console.log('👤 RoleGuard - Redirection vers médecin dashboard');
              this.router.navigate(['/dashboard/medecin']);
              break;
            case 'admin':
              console.log('👤 RoleGuard - Redirection vers admin dashboard');
              this.router.navigate(['/dashboard/admin']);
              break;
            default:
              console.log('👤 RoleGuard - Rôle inconnu, redirection vers login');
              this.router.navigate(['/login']);
              break;
          }
        } else {
          console.log('👤 RoleGuard - Aucun utilisateur, redirection vers login');
          this.router.navigate(['/login']);
        }
        return false;
      }
    }
    
    console.log('✅ RoleGuard - Aucune restriction de rôle, accès autorisé');
    return true;
  }
}