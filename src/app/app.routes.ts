// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { ConsumableListComponent } from './components/consumable-list/consumable-list.component';
import { ConsumableDetailComponent } from './components/consumable-detail/consumable-detail.component';
import { PatrimonyListComponent } from './components/patrimony-list/patrimony-list.component';
import { PatrimonyDetailComponent } from './components/patrimony-detail/patrimony-detail.component';
import { TagListComponent } from './components/tag-list/tag-list.component';
import { StatusListComponent } from './components/status-list/status-list.component';
import { UnitListComponent } from './components/unit-list/unit-list.component';
import { ItemListComponent } from './components/items-list/items-list.component';
import { QRCodeListComponent } from './components/qrcode-list/qrcode-list.component';
import { QRCodeDetailComponent } from './components/qrcode-detail/qrcode-detail.component';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: HomeComponent },
    { path: 'consumables', component: ConsumableListComponent },
    { path: 'consumables/:nid', component: ConsumableDetailComponent },
    { path: 'patrimonies', component: PatrimonyListComponent },
    { path: 'patrimonies/:nid', component: PatrimonyDetailComponent },
    { path: 'tags', component: TagListComponent },
    { path: 'statuses', component: StatusListComponent },
    { path: 'units', component: UnitListComponent },
    { path: 'items', component: ItemListComponent },
    { path: 'qrcodes', component: QRCodeListComponent },
    { path: 'qrcodes/:id', component: QRCodeDetailComponent },
    { path: 'qrcodes/:id/read', redirectTo: '/qrcodes/:id', pathMatch: 'full' }
];