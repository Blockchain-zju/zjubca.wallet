import {Component, OnInit} from '@angular/core';
import {ToastController, LoadingController} from '@ionic/angular';
import {EosService} from '../../core/eos.service';
import {AccountService} from '../../core/account.service';
import {Router} from '@angular/router';
import {WalletService} from '../../core/wallet.service';


class ImportForm {
  privKey: string;
  password: string;
  confirmPswd: string;
  checked: boolean;
}

@Component({
  selector: 'app-import-wallet',
  templateUrl: './import-wallet.component.html',
  styleUrls: ['./import-wallet.component.scss']
})
export class ImportWalletComponent implements OnInit {
  form: ImportForm;
  ecc = window.eosjs_ecc;

  constructor(
    public toastController: ToastController,
    public loadingController: LoadingController,
    private eosService: EosService,
    private accService: AccountService,
    private walletService: WalletService,
    private router: Router
  ) {
    this.form = new ImportForm();
  }

  ngOnInit() {
  }

  async submitForm() {
    console.log(this.form);
    if (!this.form.privKey) {
      return await this.alert('私钥不能为空');
    }

    if (!this.form.password) {
      return await this.alert('密码不能为空');
    }

    if (this.form.password.length < 6) {
      return await this.alert('钱包密码须大于6位');
    }

    if (this.form.password !== this.form.confirmPswd) {
      return await this.alert('两次输入密码不一致');
    }

    const loading = await this.loadingController.create({
      message: '拼命导入中',
      duration: 0
    });
    await loading.present();
    // Fetch account list
    try {
      const pubkey = this.ecc.privateToPublic(this.form.privKey);

      const res = await this.eosService.getAccountList(pubkey);
      const names = res.account_names;
      if (names.length > 0) {
        const accounts = names.map(name => {
          return {
            name: name
          };
        });
        await this.accService.saveAccounts(accounts);
        await this.accService.setCurrent(names[0]);
        await this.walletService.saveKey(pubkey, this.form.privKey, this.form.password);
        await this.router.navigate(['/tabs']);
      } else {
        await this.alert('该密钥下无账户名');
      }

    } catch (e) {
      let msg: string = e.message;
      if (msg.indexOf('checksum') >= 0) {
        msg = '私钥格式不正确';
      }
      await this.alert(msg);
    } finally {
      await loading.dismiss();
    }
  }

  async alert(msg: string) {
    const toast = await this.toastController.create({
      message: msg,
      position: 'bottom',
      duration: 3000,
      color: 'dark'
    });
    toast.present();

  }
}