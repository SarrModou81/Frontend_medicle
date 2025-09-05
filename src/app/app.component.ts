import { Component, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'Plateforme Médicale';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Rafraîchir les données utilisateur si connecté
    if (this.authService.isAuthenticated()) {
      this.authService.refreshUser();
    }
  }
}