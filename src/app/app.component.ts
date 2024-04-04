import { Component } from '@angular/core';
import { RouterModule, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DataService } from './services/data.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ButtonModule, RouterModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'hoopfire-2024';

  constructor(public _dataService: DataService) {

  }

  setActive(type: any) {
    type === 1 ? this._dataService.isNCAAActive.set(false) : this._dataService.isNCAAActive.set(true) 
  }
}
