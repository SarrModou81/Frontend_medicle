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
    
    // Vérifier si l'utilisateur est authentifié
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return false;
    }

    // Récupérer les rôles attendus depuis les données de la route
    const expectedRoles = route.data['expectedRoles'] as string[];
    
    if (expectedRoles && expectedRoles.length > 0) {
      // Vérifier si l'utilisateur a l'un des rôles requis
      if (this.authService.hasAnyRole(expectedRoles)) {
        return true;
      } else {
        // Rediriger vers le dashboard approprié selon le rôle
        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          switch (currentUser.role) {
            case 'patient':
              this.router.navigate(['/dashboard/patient']);
              break;
            case 'medecin':
              this.router.navigate(['/dashboard/medecin']);
              break;
            case 'admin':
              this.router.navigate(['/dashboard/admin']);
              break;
            default:
              this.router.navigate(['/login']);
              break;
          }
        } else {
          this.router.navigate(['/login']);
        }
        return false;
      }
    }
    
    return true;
  }
}