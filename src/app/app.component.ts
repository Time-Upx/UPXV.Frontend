import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Stockfy';
  sidebarCollapsed = false;  // Para mobile toggle

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}