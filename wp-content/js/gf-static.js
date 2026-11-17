/* gf-static.js — rend les formulaires Gravity Forms navigables sur la copie
   statique (pas de WordPress : les envois AJAX vers la page elle-meme
   restent sans reponse et le spinner ne se resout jamais).
   - Formulaires multi-pages : navigation Next/Back cote client, validation
     locale des champs obligatoires (comme Gravity Forms).
   - Dernier Submit des formulaires d'admission (secure-forms-*) : redirection
     vers la page de reservation (etape 4, Acuity avec paiement).
   - Formulaires "Get Started" (1 page) : redirection vers intake-form/,
     comme en direct. Autres formulaires 1 page : confirmation locale.
   Ne soumet rien nulle part : aucune donnee ne quitte le navigateur. */
(function () {
  'use strict';

  function siteRoot() {
    var s = document.currentScript && document.currentScript.src;
    if (s) {
      var i = s.indexOf('/wp-content/');
      if (i > 0) return s.slice(0, i + 1);
    }
    return '/';
  }
  var ROOT = siteRoot();
  var BOOKING = { 39: 'secure-booking-new/', 40: 'secure-booking-new/', 41: 'secure-booking-renewal/', 42: 'secure-booking-renewal/' };

  function isVisible(el) {
    if (!el) return false;
    var r = el.getClientRects();
    if (!r.length) return false;
    var cs = window.getComputedStyle ? getComputedStyle(el) : null;
    if (cs && (cs.display === 'none' || cs.visibility === 'hidden')) return false;
    return true;
  }
  function clearErrors(scope) {
    scope.querySelectorAll('.validation_message').forEach(function (e) { e.remove(); });
    scope.querySelectorAll('.gfield_error').forEach(function (e) { e.classList.remove('gfield_error'); });
    var top = scope.querySelector('.gform_validation_error, .validation_error');
    if (top) top.remove();
  }
  function addError(li, msg) {
    li.classList.add('gfield_error');
    var wrap = li.querySelector('.ginput_container') || li;
    var d = document.createElement('div');
    d.className = 'validation_message';
    d.textContent = msg;
    wrap.insertAdjacentElement('afterend', d);
  }
  function canvasBlank(cv) {
    try {
      var ctx = cv.getContext('2d');
      var d = ctx.getImageData(0, 0, cv.width, cv.height).data;
      for (var i = 3; i < d.length; i += 4) { if (d[i] > 0) return false; }
      return true;
    } catch (e) { return false; }
  }
  function validatePage(scope) {
    clearErrors(scope);
    var ok = true, firstBad = null;
    scope.querySelectorAll('li.gfield_contains_required').forEach(function (li) {
      if (!isVisible(li)) return;
      var bad = false;
      var cv = li.querySelector('canvas');
      if (cv) {
        var validInput = li.querySelector('input[type=hidden][id$=_valid]');
        if ((!validInput || !validInput.value) && canvasBlank(cv)) bad = true;
      } else {
        var anyInput = false, anyFilled = false;
        li.querySelectorAll('input, textarea, select').forEach(function (inp) {
          if (inp.type === 'hidden' || inp.disabled) return;
          if (inp.type === 'radio' || inp.type === 'checkbox') {
            anyInput = true;
            if (inp.checked) anyFilled = true;
          } else {
            anyInput = true;
            if (inp.value && String(inp.value).trim() !== '') anyFilled = true;
          }
        });
        if (anyInput && !anyFilled) bad = true;
        if (!bad) {
          var em = li.querySelector('input[type=email]');
          if (em && em.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value)) bad = true;
        }
      }
      if (bad) {
        ok = false;
        addError(li, 'This field is required.');
        if (!firstBad) firstBad = li;
      }
    });
    if (!ok) {
      var top = document.createElement('div');
      top.className = 'validation_error';
      top.textContent = 'There was a problem with your submission. Please review the fields below.';
      var form = scope.closest ? scope.closest('form') : null;
      var anchor = (form && form.querySelector('.gform_body')) || form || scope;
      anchor.insertAdjacentElement('afterbegin', top);
      if (firstBad && firstBad.scrollIntoView) firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    return ok;
  }
  function pagesOf(form) {
    return Array.prototype.slice.call(form.querySelectorAll('.gform_page'));
  }
  function pageNum(page) {
    var m = page.id.match(/_(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
  }
  function currentPage(form) {
    var pages = pagesOf(form);
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].style.display !== 'none' && isVisible(pages[i])) return pages[i];
    }
    return pages[0];
  }
  function showPage(form, n) {
    pagesOf(form).forEach(function (p) {
      p.style.display = (pageNum(p) === n) ? '' : 'none';
    });
    var fid = form.id.replace('gform_', '');
    var tgt = form.querySelector('#gform_target_page_number_' + fid);
    if (tgt) tgt.value = n;
    var src = form.querySelector('#gform_source_page_number_' + fid);
    if (src) src.value = n;
    var wrap = form.closest('.gform_wrapper') || form;
    if (wrap.scrollIntoView) wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo(0, 0);
    /* Les widgets Gravity Forms (dont la signature) s'initialisent au
       chargement, quand les pages 2-3 sont cachees : le canvas se retrouve
       a 0 px. On redecelenche le re-rendu pour les reinitialiser visibles,
       comme le fait WordPress apres chaque changement de page. */
    try {
      if (window.jQuery) window.jQuery(window).trigger('gform_post_render', [fid, n]);
    } catch (e) { /* ignore */ }
    /* La signature ne se repare pas avec post_render seul : le gestionnaire
       ne fait rien quand original-width est deja enregistre (1er rendu,
       cache), et gformSignatureResize n'est pas accessible en global
       (code regroupe dans le bundle). On passe par l'instance
       SuperSignature creee par la page (window.obj<input_...>), dont la
       methode ResizeSignature remet conteneur + canvas + coordonnees
       a la bonne taille ; a defaut, on remplace le canvas par une case
       dessinable maison. */
    try {
      form.querySelectorAll('.gfield_signature_container').forEach(function (cont) {
        var cv = cont.querySelector('canvas');
        if (!cv || cv.offsetWidth !== 0) return;
        var w = 300, h = 180;
        try {
          if (window.jQuery) {
            var ow = window.jQuery(cont).data('original-width');
            var ratio = window.jQuery(cont).data('ratio');
            if (ow) { w = Math.round(ow); if (ratio) h = Math.max(180, Math.round(w * ratio)); }
          }
        } catch (e) { /* ignore */ }
        var obj = window['obj' + cv.id];
        if (obj && typeof obj.ResizeSignature === 'function') { obj.ResizeSignature(w, h); return; }
        if (typeof window.ResizeSignature === 'function') { window.ResizeSignature(cv.id, w, h); return; }
        cont.style.width = w + 'px'; cont.style.height = h + 'px'; cont.style.position = 'relative';
        var nc = document.createElement('canvas');
        nc.id = cv.id; nc.width = w; nc.height = h;
        nc.style.cssText = 'position:absolute;left:0;top:0;width:' + w + 'px;height:' + h + 'px;border:2px dashed #DDDDDD;touch-action:none;cursor:crosshair;';
        cv.parentNode.replaceChild(nc, cv);
        wireSignaturePad(nc, cont);
      });
    } catch (e) { /* ignore */ }
    try {
      form.querySelectorAll('canvas').forEach(function (cv) {
        if (cv.style.width === '0px' || cv.offsetWidth === 0) {
          cv.style.width = cv.width + 'px';
          cv.style.height = cv.height + 'px';
        }
      });
    } catch (e) { /* ignore */ }
  }
  function showConfirmation(form, msg) {
    var wrap = form.closest('.gform_wrapper') || form.parentNode;
    var d = document.createElement('div');
    d.className = 'gform_confirmation_message';
    d.textContent = msg;
    form.style.display = 'none';
    wrap.insertAdjacentElement('afterbegin', d);
    d.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function resetSubmitting(fid) {
    /* Le onclick du bouton Submit met window.gf_submitting_<id> a true avant
       l'envoi ; si la validation echoue, le drapeau reste a true et le
       bouton refuse tout clic suivant (return false) : la page reste
       bloquee sur l'erreur. On le remet a false pour permettre un nouvel essai. */
    try { window['gf_submitting_' + fid] = false; } catch (e) { /* ignore */ }
  }

  /* Case de signature de secours (si l'instance Gravity Forms n'est pas
     joignable) : dessin a la souris / au doigt, encre noire 2 px. */
  function wireSignaturePad(cv, cont) {
    var ctx = cv.getContext('2d');
    var drawing = false, last = null;
    function pos(e) {
      var r = cv.getBoundingClientRect();
      var t = (e.touches && e.touches[0]) || e;
      return { x: (t.clientX - r.left) * (cv.width / r.width), y: (t.clientY - r.top) * (cv.height / r.height) };
    }
    function markSigned() {
      var v = cont.querySelector('input[type=hidden][id$=_valid]');
      if (v) v.value = '1';
    }
    function start(e) { drawing = true; last = pos(e); markSigned(); if (e.preventDefault) e.preventDefault(); }
    function move(e) {
      if (!drawing) return;
      var p = pos(e);
      ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      last = p; if (e.preventDefault) e.preventDefault();
    }
    function end() { drawing = false; last = null; }
    cv.addEventListener('pointerdown', start);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', end);
    cv.addEventListener('pointerleave', end);
    cv.addEventListener('touchstart', start, { passive: false });
    cv.addEventListener('touchmove', move, { passive: false });
    cv.addEventListener('touchend', end);
    var li = cont.closest('li.gfield');
    if (li) {
      var reset = li.querySelector('button[id$=_resetbutton]');
      if (reset) reset.addEventListener('click', function () { ctx.clearRect(0, 0, cv.width, cv.height); });
    }
  }

  /* Boutons Next / Back (leur onclick d'origine declenchait un submit AJAX). */
  window.gfStaticGo = function (btn, target) {
    var form = btn.closest('form');
    if (!form) return false;
    var cur = currentPage(form);
    if (target > pageNum(cur) && !validatePage(cur)) return false;
    showPage(form, target);
    return false;
  };

  /* Soumissions natives (bouton Submit) : interceptees en capture, avant
     le gestionnaire AJAX de Gravity Forms. */
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form || !form.id || form.id.indexOf('gform_') !== 0) return;
    var fid = form.id.replace('gform_', '');
    var pages = pagesOf(form);
    var btn = form.querySelector('.gform_button');
    var label = btn ? (btn.value || '') : '';
    if (pages.length > 1) {
      var cur = currentPage(form);
      if (pageNum(cur) < pages.length) {
        /* Entree dans un champ : avancer comme Next, pas de soumission. */
        e.preventDefault(); e.stopPropagation();
        if (validatePage(cur)) showPage(form, pageNum(cur) + 1); else resetSubmitting(fid);
        return;
      }
      if (!validatePage(cur)) { e.preventDefault(); e.stopPropagation(); resetSubmitting(fid); return; }
      e.preventDefault(); e.stopPropagation();
      if (BOOKING[fid]) { window.location.href = ROOT + BOOKING[fid]; }
      else { showConfirmation(form, 'Thank you for your submission. We will be in touch shortly.'); }
      return;
    }
    if (label === 'Get Started') {
      if (!validatePage(form)) { e.preventDefault(); e.stopPropagation(); resetSubmitting(fid); return; }
      e.preventDefault(); e.stopPropagation();
      window.location.href = ROOT + 'intake-form/';
      return;
    }
    if (label === 'Send Message') {
      if (!validatePage(form)) { e.preventDefault(); e.stopPropagation(); resetSubmitting(fid); return; }
      e.preventDefault(); e.stopPropagation();
      showConfirmation(form, "Thanks for contacting us! We'll get back to you shortly.");
      return;
    }
    if (btn) {
      if (!validatePage(form)) { e.preventDefault(); e.stopPropagation(); resetSubmitting(fid); return; }
      e.preventDefault(); e.stopPropagation();
      showConfirmation(form, 'Thank you for your submission. We will be in touch shortly.');
    }
  }, true);
})();
