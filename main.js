(function () {
  let isRaging = false;
  let characterId;
  let isDarkMode = document.querySelector('.ct-character-sheet')?.classList.contains('ct-character-sheet--dark-mode');
  const darkBg = "#10161ADB";
  const lightBg = "#FEFEFE";
  const rageBonus = '<span class="rage-bonus" style="color: #E40712;">+2</span>';
  const rageMode = '<div id="rageMode" class="MuiTypography-root MuiTypography-h4 ddb-character-app-sn0l9p" style="font-family: &quot;Roboto Condensed&quot;; text-align: center;font-weight: 700;color: #E40712;"><p>RAGE MODE</p></div>';
  const advSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="ddbc-svg ddbc-advantage-svg ddbc-svg--positive"><g><path d="M13.3665 12.5235L12.009 8.78235L10.6516 12.5235H13.3665Z" fill="#00c680"></path><path fill-rule="evenodd" clip-rule="evenodd" d="M12.241 1.13253C12.0909 1.05 11.9091 1.05 11.759 1.13252L2.25904 6.35753C2.09927 6.4454 2 6.61329 2 6.79563V17.2044C2 17.3867 2.09927 17.5546 2.25904 17.6425L11.759 22.8675C11.9091 22.95 12.0909 22.95 12.241 22.8675L21.741 17.6425C21.9007 17.5546 22 17.3867 22 17.2044V6.79563C22 6.61329 21.9007 6.4454 21.741 6.35753L12.241 1.13253ZM18 17.5H15.1222L14.1991 14.9412H9.80091L8.87783 17.5H6L10.5611 5.5H13.4389L18 17.5Z" fill="#00c680"></path></g></svg>';
  const skillAdv = '<div class="strength-adv ct-skills__col--adjustments" style="border-bottom-color: rgba(85, 87, 82, 0.4);"><span class="ddbc-tooltip ct-skills__adjustment ddbc-advantage-icon" data-tippy="" data-original-title="Advantage"><span aria-label="Advantage">' + advSvg + '</span></span></div>';
  const savingAdv = '<span id="rageSavingModifier" class="ddbc-tooltip ct-saving-throws-box__modifier" data-tippy="" data-original-title="Advantage on STR while raging"><div class="ct-dice-adjustment-summary"><span class="ddbc-tooltip ct-dice-adjustment-summary__icon ddbc-advantage-icon" data-tippy="" data-original-title="Advantage"><span aria-label="Advantage">' + advSvg + '</span></span><span class="ct-dice-adjustment-summary__description">on <span class="ct-dice-adjustment-summary__description--ability">STR</span></span><span class="ct-dice-adjustment-summary__restriction" style="color: #E40712;">while raging</span></div></span>';
  // using initiative adv because placement is handled by their css
  const initiateAdv = '<div class="ct-initiative-box__advantage" aria-label="Has advantage on STR checks"><span class="ddbc-tooltip ct-initiative-box__advantage-icon ddbc-advantage-icon ddbc-tooltip--dark-mode" data-tippy="" data-original-title="Advantage on STR checks"><span aria-label="Advantage">' + advSvg + '</span></span></div>';

  function findRage() {
    const headings = Array.prototype.slice.call(document.querySelectorAll(".ct-feature-snippet__heading"));
    return headings.find((element) => element.textContent.trim() === "Rage")?.parentElement;
  }

  function enterRageMode(rageContainer) {
    document.body.classList.add('beyond-rage--raging');
    // Add RAGE MODE to header
    const gap = document.querySelector('.ct-character-header-desktop__group.ct-character-header-desktop__group--gap');
    if (gap && !document.getElementById('rageMode')) {
      gap.innerHTML = rageMode;
    }

    // Add damage bonus
    document.querySelectorAll('.ddbc-combat-attack__damage .ddbc-damage__value').forEach((damage) => {
      if (!damage.getElementsByClassName('rage-mode').length) {
        const bonus = document.createElement('span');
        bonus.innerHTML = rageBonus;
        damage.appendChild(bonus);
      }
    });

    // Add saving throw advantage
    const modifiers = document.querySelector('.ct-saving-throws-box__modifiers');
    if (modifiers && !document.getElementById('rageSavingModifier')) {
      const savingAdvantage = document.createElement('span');
      savingAdvantage.innerHTML = savingAdv;
      modifiers.appendChild(savingAdvantage);
    }

    // Add STR skills advantages
    document.querySelectorAll('.ct-skills__list .ct-skills__item').forEach((skillRow) => {
      if (skillRow.querySelector('.ct-skills__col--stat')?.textContent.trim() === "STR" && !skillRow.querySelector('.strength-adv')) {
        const strAdv = document.createElement('div');
        strAdv.innerHTML = skillAdv;
        skillRow.insertBefore(strAdv, skillRow.querySelector('.ct-skills__col--modifier'));
      }
    })

    // Add STR check advantage (assume first is STR) (bad I know)
    const strengthAbility = document.querySelector('.ct-quick-info__ability');
    if (strengthAbility && !document.getElementById('strengthAbilityAdvantage')) {
      const strAbilityAdv = document.createElement('div');
      strAbilityAdv.id = "strengthAbilityAdvantage";
      strAbilityAdv.innerHTML = initiateAdv;
      strAbilityAdv.firstChild.style.background = isDarkMode ? darkBg : lightBg;
      strAbilityAdv.firstChild.style.borderRadius = "100%";
      strengthAbility.appendChild(strAbilityAdv);
    }

    // Add "End Rage" button
    if (!document.getElementById('endRage')) {
      const endRage = document.createElement('button');
      endRage.id = "endRage";
      endRage.classList.add('ct-theme-button', 'ct-theme-button--outline', 'ct-theme-button--interactive', 'ct-button', 'character-button', 'ddbc-button', 'character-button-small');
      endRage.role = "button";
      endRage.innerHTML = '<span class="ct-button__content">End rage</span>';
      endRage.style.marginTop = "1em";
      endRage.onclick = leaveRageMode;
      rageContainer.appendChild(endRage);
    }

    // Save to storage
    if (characterId) {
      chrome.storage.sync.set({[`dndRage__${characterId}`]: { isRaging: true }});
    }
  }

  function leaveRageMode(e) {
    e?.preventDefault();

    document.body.classList.remove('beyond-rage--raging');

    // remove rage mode from header
    document.getElementById('rageMode')?.remove();

    // remove rage bonus from attacks
    document.querySelectorAll('.rage-bonus').forEach((bonus) => {
      bonus.parentElement.remove();
    });

    // Remove saving throw advantage
    document.getElementById('rageSavingModifier')?.remove();

    // Remove STR skills advantages
    document.querySelectorAll('.strength-adv').forEach((elem) => {
      elem.parentElement.remove();
    });

    // Remove STR check advantage (assume first is STR) (bad I know)
    document.getElementById('strengthAbilityAdvantage')?.remove();

    document.getElementById('endRage')?.remove();

    // Save to storage
    if (characterId) {
      chrome.storage.sync.set({[`dndRage__${characterId}`]: { isRaging: false }});
    }
  }

  function init() {
    isDarkMode = document.querySelector('.ct-character-sheet')?.classList.contains('ct-character-sheet--dark-mode');
    const pieces = window.location.href.split('/');
    const index = pieces.findIndex((part) => part === 'characters');
    if (index > -1 && pieces.length >= index + 2) {
      characterId = pieces[index + 1];
    }
    
    const rageContainer = findRage();
    if (rageContainer) {
      const rageUses = rageContainer.querySelectorAll('.ct-feature-snippet__limited-use .ct-slot-manager__slot[role="checkbox"]');
      rageUses.forEach((use) => {
        use.addEventListener('click', (elem) => {
          // this value hasn't changed yet.
          const isEnteringRage = elem.target.getAttribute('aria-checked') !== 'true';
          if (isEnteringRage) {
            enterRageMode(rageContainer);
          } else {
            leaveRageMode();
          }
        });
      });
    }

    // load from local storage
    if (characterId) {
      chrome.storage.sync.get([`dndRage__${characterId}`], function(characterStatus) {
        isRaging = characterStatus?.[`dndRage__${characterId}`]?.isRaging;
        if (isRaging) {
          enterRageMode(rageContainer);
        }
      });
    }
  }

  const observer = new MutationObserver(function (mutations_list) {
    mutations_list.forEach(function (mutation) {
      mutation.addedNodes.forEach(function (added_node) {
        if (added_node.classList.contains('dice-rolling-panel')) {
          observer.disconnect();
          init();
        }
      });
    });
  });

  observer.observe(document.querySelector("body#site"), { subtree: false, childList: true });
})();
