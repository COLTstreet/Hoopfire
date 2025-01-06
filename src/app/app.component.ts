import { Component, inject } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { DataService } from './services/data.service';
import { PrimeNG } from 'primeng/config';
import { ButtonModule } from 'primeng/button';
import { HeaderComponent } from './common/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, ButtonModule, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'hoopfire-2024';
  
  public config: PrimeNG = inject(PrimeNG);

  constructor(public _dataService: DataService) {

  }

  setActive(type: any) {
    type === 1 ? this._dataService.isNCAAActive.set(false) : this._dataService.isNCAAActive.set(true) 
  }
}
