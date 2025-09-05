import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    
    console.log('🔒 AuthGuard - Vérification accès à:', state.url);
    
    const isAuthenticated = this.authService.isAuthenticated();
    const currentUser = this.authService.getCurrentUser();
    
    console.log('🔒 AuthGuard - isAuthenticated:', isAuthenticated);
    console.log('🔒 AuthGuard - currentUser:', currentUser);
    console.log('🔒 AuthGuard - token existe:', !!this.authService.getToken());
    
    if (isAuthenticated && currentUser) {
      console.log('✅ AuthGuard - Accès autorisé');
      return true;
    }

    console.log('❌ AuthGuard - Accès refusé, redirection vers /login');
    console.log('🔒 AuthGuard - Données localStorage:');
    console.log('   - auth_token:', localStorage.getItem('auth_token'));
    console.log('   - auth_user:', localStorage.getItem('auth_user'));

    // Rediriger vers la page de connexion si non authentifié
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    
    return false;
  }
}