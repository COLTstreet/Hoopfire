import { Component, inject } from '@angular/core';
import { Router, RouterModule, RouterOutlet } from '@angular/router';
import { DataService } from './services/data.service';
import { ButtonModule } from 'primeng/button';
import { HeaderComponent } from './common/header/header.component';
import { SplitButtonModule } from 'primeng/splitbutton';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet, RouterModule, ButtonModule, HeaderComponent, SplitButtonModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'hoopfire-2024';

  itemsNCAA: any[] = [];
  itemsNBA: any[] = [];
  
  constructor(public _dataService: DataService, private _router: Router) {
      this.itemsNCAA = [
        {
            label: 'Custom NCAA Matchup',
            icon: 'pi pi-refresh',
            command: () => {
              this._router.navigate(['/custom-games-ncaa']);
            },
        },
      ]
      this.itemsNBA = [
        {
            label: 'Custom NBA Matchup',
            icon: 'pi pi-refresh',
            command: () => {
              this._router.navigate(['/custom-games']);
            },
        },
      ]
  }

  setActive(type: any) {
    type === 1 ? this._dataService.isNCAAActive.set(false) : this._dataService.isNCAAActive.set(true) 
  }
}
