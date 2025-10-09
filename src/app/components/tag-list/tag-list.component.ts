import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UtilsService } from '../../services/utils.service';
import { ModalService } from '../../services/modal.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tag-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './tag-list.component.html',
  styleUrls: ['./tag-list.component.css']
})
export class TagListComponent implements OnInit {
  tags: any[] = [];
  mensagemErro = '';
  mensagemSucesso = '';
  formGroup: FormGroup;
  editModeId: number | null = null;
  carregandoForm = false;
  formSubmitted = false;

  hoverCard = false;

  private subscription: Subscription = new Subscription();

  constructor(
    private utilsService: UtilsService,
    private modalService: ModalService,
    private fb: FormBuilder
  ) {
    this.formGroup = this.fb.group({
      tid: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    this.loadTags();
    this.subscription.add(
      this.modalService.onConfirm().subscribe(item => {
        if (item.type === 'tag') {
          this.deletar(item.nid);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadTags() {
    this.utilsService.listarTags().subscribe({
      next: (data: any) => this.tags = data.items || data,
      error: () => this.mensagemErro = 'Erro ao carregar tags.'
    });
  }

  toggleEdit(nid: number | null) {
    this.editModeId = nid;
    this.formSubmitted = false;
    if (nid) {
      const tag = this.tags.find(t => t.nid === nid);
      this.formGroup.patchValue({
        tid: tag.tid,
        description: tag.description
      });
    } else {
      this.formGroup.reset();
    }
  }

  salvar(nid: number | null) {
    this.formSubmitted = true;
    if (this.formGroup.valid) {
      this.carregandoForm = true;
      const payload = this.formGroup.value;
      if (nid) {
        payload.nid = nid;
        this.utilsService.atualizarTag(payload).subscribe({
          next: () => {
            this.mensagemSucesso = 'Tag atualizada!';
            this.loadTags();
            this.toggleEdit(null);
            setTimeout(() => this.mensagemSucesso = '', 3000);
          },
          error: () => this.mensagemErro = 'Erro ao atualizar tag.',
          complete: () => this.carregandoForm = false
        });
      } else {
        this.utilsService.adicionarTag(payload).subscribe({
          next: () => {
            this.mensagemSucesso = 'Tag adicionada!';
            this.loadTags();
            this.toggleEdit(null);
            setTimeout(() => this.mensagemSucesso = '', 3000);
          },
          error: () => this.mensagemErro = 'Erro ao adicionar tag.',
          complete: () => this.carregandoForm = false
        });
      }
    }
  }

  confirmarDeletar(nid: number, tid: string) {
    this.checkIfUsed(nid, () => {
      this.modalService.showConfirmation(
        'Excluir Tag',
        `Deseja excluir a tag "${tid}"?`,
        { nid, tid, type: 'tag' }
      );
    });
  }

  checkIfUsed(nid: number, onNotUsed: () => void) {
    // Verifica uso em consumíveis
    this.utilsService.checkTagUsageInConsumables(nid).subscribe({
      next: (data: any) => {
        if (data.items.length > 0) {
          this.mensagemErro = 'Tag em uso por consumíveis. Não pode ser deletada.';
          setTimeout(() => this.mensagemErro = '', 3000);
          return;
        }

        // Verifica uso em patrimônios
        this.utilsService.checkTagUsageInPatrimonies(nid).subscribe({
          next: (data: any) => {
            if (data.items.length > 0) {
              this.mensagemErro = 'Tag em uso por patrimônios. Não pode ser deletada.';
              setTimeout(() => this.mensagemErro = '', 3000);
              return;
            }
            onNotUsed();
          },
          error: () => this.mensagemErro = 'Erro ao verificar uso da tag.'
        });
      },
      error: () => this.mensagemErro = 'Erro ao verificar uso da tag.'
    });
  }

  deletar(nid: number) {
    this.utilsService.deletarTag(nid).subscribe({
      next: () => {
        this.mensagemSucesso = 'Tag excluída!';
        this.loadTags();
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: (err) => {
        this.mensagemErro = err.error?.message || 'Erro ao excluir tag.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }
}