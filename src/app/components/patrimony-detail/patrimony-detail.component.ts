import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PatrimonyService, Patrimony } from '../../services/patrimony.service';
import { UtilsService, PageDTO, Status, Tag } from '../../services/utils.service';
import { ModalService, ModalActionItem } from '../../services/modal.service';
import QRCode from 'qrcode';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-patrimony-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './patrimony-detail.component.html',
  styleUrls: ['./patrimony-detail.component.css']
})
export class PatrimonyDetailComponent implements OnInit, OnDestroy {
  item: Patrimony = {} as Patrimony;
  carregando = true;
  qrCodeUrl = '';
  mostrandoQrCode = false;
  baseUrl = window.location.origin;
  editMode = false;
  mensagemErro = '';
  mensagemSucesso = '';
  carregandoEdit = false;
  formSubmitted = false;
  editForm: FormGroup;
  statuses: Status[] = [];
  tags: Tag[] = [];
  showAddTagInput = false;
  newTagName = '';
  newTagDescription = '';
  carregandoTag = false;
  selectedTagIds: number[] = [];

  private subscription = new Subscription();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: PatrimonyService,
    private utilsService: UtilsService,
    private modalService: ModalService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      statusId: ['', Validators.required]
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadItem(+id);
      this.loadStatuses();
      this.loadTags();
    } else {
      this.router.navigate(['/patrimonies']);
    }

    this.subscription.add(
      this.modalService.onConfirm().subscribe((item: ModalActionItem) => {
        if (item.type === 'patrimony' && item.nid === this.item.id) {
          this.deletar(item.nid);
        } else if (item.type === 'tag') {
          this.deletarTag(item.nid);
        }
      })
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  loadItem(id: number) {
    this.carregando = true;
    this.service.getById(id).subscribe({
      next: (data: Patrimony) => {
        this.item = data;
        this.selectedTagIds = data.tags?.map(t => t.id) || [];
        this.populateEditForm();
        this.carregando = false;
      },
      error: () => {
        this.mensagemErro = 'Erro ao carregar patrimônio.';
        setTimeout(() => this.router.navigate(['/patrimonies']), 2000);
      }
    });
  }

  loadStatuses() {
    this.utilsService.listarStatuses(0, 100).subscribe({
      next: (page: PageDTO<Status>) => this.statuses = page.items,
      error: () => this.statuses = []
    });
  }

  loadTags() {
    this.utilsService.listarTags(0, 200).subscribe({
      next: (page: PageDTO<Tag>) => this.tags = page.items,
      error: () => {
        this.mensagemErro = 'Erro ao carregar tags.';
        this.tags = [];
      }
    });
  }

  populateEditForm() {
    this.editForm.patchValue({
      name: this.item.name,
      description: this.item.description,
      statusId: this.item.status?.id
    });
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    if (this.editMode) {
      this.populateEditForm();
    } else {
      this.formSubmitted = false;
      this.mensagemErro = '';
      this.mensagemSucesso = '';
      this.showAddTagInput = false;
    }
  }

  atualizar() {
    this.formSubmitted = true;
    if (this.editForm.valid) {
      this.carregandoEdit = true;
      const payload = {
        name: this.editForm.value.name,
        description: this.editForm.value.description,
        statusId: +this.editForm.value.statusId,
        tagIds: this.selectedTagIds
      };

      this.service.atualizar(this.item.id, payload).subscribe({
        next: (updated: Patrimony) => {
          this.item = updated;
          this.selectedTagIds = updated.tags?.map(t => t.id) || [];
          this.mensagemSucesso = 'Patrimônio atualizado com sucesso!';
          this.toggleEdit();
          setTimeout(() => this.mensagemSucesso = '', 3000);
        },
        error: (err) => {
          this.mensagemErro = err.error?.message || 'Erro ao atualizar.';
          setTimeout(() => this.mensagemErro = '', 5000);
        },
        complete: () => this.carregandoEdit = false
      });
    }
  }

  toggleAddTagInput() {
    this.showAddTagInput = !this.showAddTagInput;
    if (!this.showAddTagInput) {
      this.newTagName = '';
      this.newTagDescription = '';
    }
  }

  adicionarTag() {
    const name = this.newTagName.trim();
    if (!name) {
      this.mensagemErro = 'Nome da tag é obrigatório.';
      setTimeout(() => this.mensagemErro = '', 3000);
      return;
    }

    if (this.tags.some(t => t.name.toLowerCase() === name.toLowerCase())) {
      this.mensagemErro = 'Tag com este nome já existe.';
      setTimeout(() => this.mensagemErro = '', 3000);
      return;
    }

    this.carregandoTag = true;
    const payload = { name, description: this.newTagDescription.trim() || '' };

    this.utilsService.adicionarTag(payload).subscribe({
      next: () => {
        this.mensagemSucesso = 'Tag adicionada!';
        this.loadTags();
        this.toggleAddTagInput();
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: (err) => {
        this.mensagemErro = err.error?.message || 'Erro ao adicionar tag.';
        setTimeout(() => this.mensagemErro = '', 5000);
      },
      complete: () => this.carregandoTag = false
    });
  }

  confirmarDeletarTag(id: number, name: string) {
    this.modalService.showConfirmation(
      'Excluir Tag',
      `Deseja excluir a tag "<strong>${name}</strong>"?`,
      { nid: id, name: name, type: 'tag' }
    );
  }

  deletarTag(id: number) {
    this.utilsService.deletarTag(id).subscribe({
      next: () => {
        this.mensagemSucesso = 'Tag excluída!';
        this.loadTags();
        this.selectedTagIds = this.selectedTagIds.filter(t => t !== id);
        setTimeout(() => this.mensagemSucesso = '', 3000);
      },
      error: () => {
        this.mensagemErro = 'Erro ao excluir tag.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }

  toggleAssignTag(tagId: number) {
    this.selectedTagIds = this.selectedTagIds.includes(tagId)
      ? this.selectedTagIds.filter(id => id !== tagId)
      : [...this.selectedTagIds, tagId];
  }

  isAssigned(tagId: number): boolean {
    return this.selectedTagIds.includes(tagId);
  }

  gerarQrCode() {
    const link = `${this.baseUrl}/patrimonies/${this.item.id}`;
    QRCode.toDataURL(link, { width: 300, margin: 1, errorCorrectionLevel: 'H' })
      .then(url => {
        this.qrCodeUrl = url;
        this.mostrandoQrCode = true;
      })
      .catch(() => this.mensagemErro = 'Erro ao gerar QR Code.');
  }

  fecharQrCode() {
    this.mostrandoQrCode = false;
    this.qrCodeUrl = '';
  }

  imprimirQrCode() {
    if (!this.qrCodeUrl) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>QR Code - ${this.item.name}</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
              img { max-width: 200px; margin: 20px 0; }
            </style>
          </head>
          <body onload="window.print(); window.close()">
            <h2>${this.item.name}</h2>
            <img src="${this.qrCodeUrl}" />
            <p><small>${this.baseUrl}/patrimonies/${this.item.id}</small></p>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  }

  confirmarDeletar(id: number, name: string) {
    this.modalService.showConfirmation(
      'Excluir Patrimônio',
      `Deseja realmente excluir "<strong>${name}</strong>"?`,
      { nid: id, name, type: 'patrimony' }
    );
  }

  deletar(id: number) {
    this.service.deletar(id).subscribe({
      next: () => this.router.navigate(['/patrimonies']),
      error: () => {
        this.mensagemErro = 'Erro ao deletar patrimônio.';
        setTimeout(() => this.mensagemErro = '', 5000);
      }
    });
  }
}