import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PatrimonyService } from '../../services/patrimony.service';
import { AuxService } from '../../services/aux.service';
import { ModalService } from '../../services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-patrimony-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
  templateUrl: './patrimony-list.component.html',
  styleUrls: ['./patrimony-list.component.css']
})
export class PatrimonyListComponent implements OnInit, OnDestroy {
  patrimonies: any[] = [];
  statuses: any[] = [];
  formVisible = false;
  mensagemErro = '';
  mensagemSucesso = '';
  formSubmitted = false;
  carregandoForm = false;
  formGroup: FormGroup;

  private subscription: Subscription = new Subscription();

  hoverCard = false;

  constructor(
    private patrimonyService: PatrimonyService,
    private auxService: AuxService,
    private fb: FormBuilder,
    private modalService: ModalService
  ) {
    this.formGroup = this.fb.group({
      tid: ['', Validators.required],
      description: [''],
      registeredBy: [''],
      statusNid: ['', Validators.required],
      tagNids: ['']
    });
  }

  ngOnInit() {
    this.loadPatrimonies();
    this.loadStatuses();

    // Escuta confirmações para patrimônio
    this.subscription.add(
      this.modalService.onConfirm().subscribe(item => {
        if (item.type === 'patrimony') {
          this.deletar(item.nid);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadPatrimonies() {
    this.patrimonyService.listar().subscribe({
      next: (response: any) => {
        this.patrimonies = response.items || response;
      },
      error: (err) => {
        console.error('Erro API:', err);
        this.mensagemErro = 'Erro ao carregar patrimônios. Tente novamente.';
        this.patrimonies = [];
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }

  loadStatuses() {
    this.auxService.listarStatuses().subscribe({
      next: (data: any) => this.statuses = data.items || data,
      error: () => {
        this.mensagemErro = 'Erro ao carregar status.';
        this.statuses = [];
        setTimeout(() => this.mensagemErro = '', 3000);
      }
    });
  }

  toggleForm() {
    this.formVisible = !this.formVisible;
    if (!this.formVisible) {
      this.formGroup.reset();
      this.formSubmitted = false;
    }
  }

  criar() {
    this.formSubmitted = true;
    if (this.formGroup.valid) {
      this.carregandoForm = true;
      this.mensagemErro = '';
      const payload = {
        ...this.formGroup.value,
        tagNids: this.formGroup.value.tagNids ? this.formGroup.value.tagNids.split(',').map((id: string) => parseInt(id.trim())).filter((id: number) => !isNaN(id)) : []
      };
      this.patrimonyService.criar(payload).subscribe({
        next: () => {
          this.mensagemSucesso = 'Patrimônio criado com sucesso!';
          this.loadPatrimonies();
          this.toggleForm();
          setTimeout(() => this.mensagemSucesso = '', 3000);
        },
        error: (err) => {
          console.error('Erro ao criar:', err);
          this.mensagemErro = err.error?.message || 'Erro ao criar patrimônio.';
          setTimeout(() => this.mensagemErro = '', 5000);
        },
        complete: () => this.carregandoForm = false
      });
    }
  }

  confirmarDeletar(nid: number, tid: string) {
    this.modalService.showConfirmation(
      'Excluir Patrimônio',
      `Deseja realmente excluir o item "${tid}"?`,
      { nid, tid, type: 'patrimony' }
    );
  }

  deletar(nid: number) {
    this.patrimonyService.deletar(nid).subscribe({
      next: () => {
        this.mensagemSucesso = 'Patrimônio deletado com sucesso!';
        this.loadPatrimonies();
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: (err) => {
        console.error('Erro ao deletar:', err);
        this.mensagemErro = err.error?.message || 'Erro ao deletar patrimônio.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }
}