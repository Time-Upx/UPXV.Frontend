import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { CadastroComponent } from './cadastro/cadastro.component';
import { HomeComponent } from './home/home.component';
import { AuthGuard } from './services/auth.guard';
import { ProdutoFormComponent } from './produto-form/produto-form.component';
import { ProdutoListaComponent } from './produto-lista/produto-lista.component';
import { ProdutoDetalheComponent } from './produto-detalhe/produto-detalhe.component';

export const routes: Routes = [
    { path: '', redirectTo: '/login', pathMatch: 'full' },
    { path: 'login', component: LoginComponent },
    { path: 'cadastro', component: CadastroComponent },
    { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
    { path: 'produtos', component: ProdutoListaComponent, canActivate: [AuthGuard] },
    { path: 'produto/novo', component: ProdutoFormComponent, canActivate: [AuthGuard] },
    { path: 'produto/editar/:id', component: ProdutoFormComponent, canActivate: [AuthGuard] },
    { path: 'produto/detalhes/:id', component: ProdutoDetalheComponent } // Pública, sem guard
];