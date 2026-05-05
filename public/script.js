// 전역 변수 선언
let hasScrolledToBottom = false;
let guardianHasScrolledToBottom = false;

// 인증 상태 관리
let currentVerificationPhone = '';
let currentVerificationCode = '';
let verificationTimeout = null;
const verifiedPhones = new Set(); // 인증된 전화번호 목록

document.addEventListener('DOMContentLoaded', function() {
    const termsContainer = document.getElementById('termsContainer');
    const termsAgree = document.getElementById('termsAgree');
    const scrollIndicator = document.getElementById('scrollIndicator');
    const isMinor = document.getElementById('isMinor');
    const submitBtn = document.getElementById('submitBtn');
    const agreementForm = document.getElementById('agreementForm');
    const privacyAgree = document.getElementById('privacyAgree');
    
    // 보호자 관련 요소
    const guardianSection = document.getElementById('guardianSection');
    const guardianConsentSection = document.getElementById('guardianConsentSection');
    const guardianTermsContainer = document.getElementById('guardianTermsContainer');
    const guardianTermsAgree = document.getElementById('guardianTermsAgree');
    const guardianScrollIndicator = document.getElementById('guardianScrollIndicator');
    const warningMessage = document.getElementById('warningMessage');
    
    // 전화번호 인증 관련 요소
    const contactVerifyBtn = document.getElementById('contactVerifyBtn');
    const guardianContactVerifyBtn = document.getElementById('guardianContactVerifyBtn');
    const phoneVerifyModal = document.getElementById('phoneVerifyModal');
    const closeVerifyModal = document.getElementById('closeVerifyModal');
    const verificationCode = document.getElementById('verificationCode');
    const resendCodeBtn = document.getElementById('resendCodeBtn');
    const confirmVerificationBtn = document.getElementById('confirmVerificationBtn');
    const verifyStep1 = document.getElementById('verifyStep1');
    const verifyStep2 = document.getElementById('verifyStep2');
    const contactStatus = document.getElementById('contactStatus');
    const guardianContactStatus = document.getElementById('guardianContactStatus');

    // 약관 스크롤 감지
    termsContainer.addEventListener('scroll', function() {
        const scrollPercentage = (termsContainer.scrollTop + termsContainer.clientHeight) / termsContainer.scrollHeight;
        
        if (scrollPercentage >= 0.95) {
            hasScrolledToBottom = true;
            termsAgree.disabled = false;
            privacyAgree.disabled = false;
            scrollIndicator.style.display = 'none';
            scrollIndicator.innerHTML = '<span style="color: #28a745;">✓ 약관을 모두 읽으셨습니다</span>';
        } else {
            hasScrolledToBottom = false;
            termsAgree.disabled = true;
            privacyAgree.disabled = true;
            scrollIndicator.style.display = 'block';
            scrollIndicator.innerHTML = '<span>약관을 끝까지 스크롤하여 동의 버튼을 활성화하세요</span>';
        }
    });

    // 보호자 약관 스크롤 감지
    guardianTermsContainer.addEventListener('scroll', function() {
        const scrollPercentage = (guardianTermsContainer.scrollTop + guardianTermsContainer.clientHeight) / guardianTermsContainer.scrollHeight;
        
        if (scrollPercentage >= 0.95) {
            guardianHasScrolledToBottom = true;
            guardianTermsAgree.disabled = false;
            guardianScrollIndicator.style.display = 'none';
            guardianScrollIndicator.innerHTML = '<span style="color: #28a745;">✓ 약관을 모두 읽으셨습니다</span>';
        } else {
            guardianHasScrolledToBottom = false;
            guardianTermsAgree.disabled = true;
            guardianScrollIndicator.style.display = 'block';
            guardianScrollIndicator.innerHTML = '<span>약관을 끝까지 스크롤하여 동의 버튼을 활성화하세요</span>';
        }
    });

    // 약관 동의 체크박스
    termsAgree.addEventListener('change', function() {
        validateForm();
    });

    // 보호자 약관 동의 체크박스
    guardianTermsAgree.addEventListener('change', function() {
        validateForm();
    });

    privacyAgree.addEventListener('change', function() {
        validateForm();
    });

    // 만 14세 이상 체크박스
    isMinor.addEventListener('change', function() {
        updateButtonText();
        toggleGuardianSection();
        validateForm();
    });

    // 보호자 섹션 토글 함수
    function toggleGuardianSection() {
        if (isMinor.checked) {
            // 14세 미만이면 보호자 섹션 보이기
            guardianSection.style.display = 'block';
            guardianConsentSection.style.display = 'block';
            // 보호자 약관 스크롤 초기화
            guardianHasScrolledToBottom = false;
            guardianTermsAgree.disabled = true;
            guardianTermsAgree.checked = false;
            guardianScrollIndicator.style.display = 'block';
            guardianScrollIndicator.innerHTML = '<span>약관을 끝까지 스크롤하여 동의 버튼을 활성화하세요</span>';
            guardianTermsContainer.scrollTop = 0;
            
            // 보호자 필드 초기 상태 설정 - 빨간색 테두리
            const guardianInputs = ['guardianName', 'guardianContact', 'guardianRelationship'];
            guardianInputs.forEach(id => {
                document.getElementById(id).style.borderColor = '#f44336';
            });
        } else {
            // 14세 이상이면 보호자 섹션 숨기기
            guardianSection.style.display = 'none';
            guardianConsentSection.style.display = 'none';
            
            // 보호자 필드 테두리 초기화
            const guardianInputs = ['guardianName', 'guardianContact', 'guardianRelationship'];
            guardianInputs.forEach(id => {
                document.getElementById(id).style.borderColor = '';
            });
        }
    }

    // 버튼 텍스트 업데이트 함수
    function updateButtonText() {
        submitBtn.textContent = '제출하기';
    }

    // 모달 닫기
    closeModal.addEventListener('click', function() {
        guardianModal.style.display = 'none';
        isMinor.checked = false;
        updateButtonText();
        validateForm();
    });

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', function(event) {
        if (event.target === guardianModal) {
            guardianModal.style.display = 'none';
            isMinor.checked = false;
            updateButtonText();
            validateForm();
        }
    });

    // 보호자 정보 확인
    confirmGuardian.addEventListener('click', function() {
        const guardianName = document.getElementById('guardianName');
        const guardianContact = document.getElementById('guardianContact');
        const guardianRelation = document.getElementById('guardianRelation').value.trim();
        const guardianConsent = document.getElementById('guardianConsent').checked;

        // 빈 필드 확인 및 빨간색 테두리 적용
        if (!guardianName.value.trim()) {
            guardianName.style.borderColor = '#f44336';
        } else {
            guardianName.style.borderColor = '';
        }
        
        if (!guardianContact.value.trim()) {
            guardianContact.style.borderColor = '#f44336';
        } else {
            guardianContact.style.borderColor = '';
        }

        if (!guardianName.value.trim() || !guardianContact.value.trim() || !guardianRelation || !guardianConsent) {
            alert('모든 보호자 정보 필드를 입력하고 동의해주세요.');
            return;
        }

        guardianInfoProvided = true;
        guardianModal.style.display = 'none';
        validateForm();
    });

    // 입력 필드 유효성 검사 함수
    function validateInput(input, validationRules) {
        const value = input.value.trim();
        const isValid = validationRules.test(value);
        
        if (isValid) {
            input.setCustomValidity('');
        } else {
            input.setCustomValidity('입력 형식이 올바르지 않습니다.');
        }
        
        return isValid;
    }

    // 개별 입력 필드 유효성 검사
    function validateName() {
        const name = document.getElementById('name');
        const koreanPattern = /^[가-힣]{1,5}$/;
        return validateInput(name, koreanPattern, false);
    }

    function validateContact() {
        const contact = document.getElementById('contact');
        const phonePattern = /^[0-9]{11}$/;
        return validateInput(contact, phonePattern, false);
    }

    function validateDiscord() {
        const discord = document.getElementById('discord');
        const discordPattern = /^[a-zA-Z0-9_.]{2,32}$/;
        return validateInput(discord, discordPattern, false);
    }

    function validateRoblox() {
        const roblox = document.getElementById('roblox');
        const robloxPattern = /^[a-zA-Z0-9_]{3,20}$/;
        return validateInput(roblox, robloxPattern, false);
    }

    // 보호자 정보 유효성 검사 함수
    function validateGuardianInfo() {
        const guardianName = document.getElementById('guardianName').value.trim();
        const guardianContact = document.getElementById('guardianContact').value.trim();
        const guardianRelationship = document.getElementById('guardianRelationship').value.trim();
        const guardianTermsChecked = guardianTermsAgree.checked;

        // 개별 필드 유효성 검사는 이제 각 필드의 상태 메시지로 처리됨
        const isNameValid = guardianName && guardianName !== document.getElementById('name').value.trim();
        const isContactValid = guardianContact && guardianContact !== document.getElementById('contact').value.trim();
        const isRelationshipValid = guardianRelationship;

        return isNameValid && isContactValid && isRelationshipValid && guardianTermsChecked && 
               guardianHasScrolledToBottom;
    }

    // 폼 유효성 검사
    function validateForm() {
        const name = document.getElementById('name').value.trim();
        const contact = document.getElementById('contact').value.trim();
        const discord = document.getElementById('discord').value.trim();
        const roblox = document.getElementById('roblox').value.trim();
        const privacyChecked = privacyAgree.checked;
        const termsChecked = termsAgree.checked;
        const isMinorChecked = isMinor.checked;

        // 개별 유효성 검사 실행
        const isNameValid = validateName();
        const isContactValid = validateContact();
        const isDiscordValid = validateDiscord();
        const isRobloxValid = validateRoblox();

        // 전화번호 인증 확인
        const isContactVerified = verifiedPhones.has(contact);
        
        // 보호자 정보는 14세 미만인 경우에만 필요
        let guardianInfoValid = true;
        let isGuardianContactVerified = true;
        if (isMinorChecked) {
            guardianInfoValid = validateGuardianInfo();
            const guardianContact = document.getElementById('guardianContact').value.trim();
            isGuardianContactVerified = verifiedPhones.has(guardianContact);
        }

        const isFormValid = name && contact && discord && roblox && privacyChecked && termsChecked && 
                           hasScrolledToBottom && guardianInfoValid &&
                           isNameValid && isContactValid && isDiscordValid && isRobloxValid &&
                           isContactVerified && isGuardianContactVerified;

        submitBtn.disabled = !isFormValid;
    }

    // 입력 필드 변경 시 유효성 검사 및 테두리 색상 업데이트
    const requiredInputs = ['name', 'contact', 'discord', 'roblox'];
    requiredInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', function() {
            validateForm();
            updateFieldBorder(this, id);
        });
        document.getElementById(id).addEventListener('blur', function() {
            validateForm();
            updateFieldBorder(this, id);
        });
    });

    // 보호자 입력 필드 변경 시 유효성 검사 및 테두리 색상 업데이트
    const guardianInputs = ['guardianName', 'guardianContact', 'guardianRelationship'];
    guardianInputs.forEach(id => {
        document.getElementById(id).addEventListener('input', function() {
            validateForm();
            updateFieldBorder(this, id);
            
            // 보호자 이름 입력 시 이름 유효성 검사
            if (id === 'guardianName') {
                updateGuardianNameState();
            }
        });
    });

    // 관계 필드가 제거되었으므로 함수는 비워둠
    function ensureGuardianRelationInput() {
        // 관계 필드가 제거되었으므로 아무 동작 하지 않음
    }

    // 주기적으로 입력 제한 확인 (보호자 섹션 토글 시)
    const originalToggleGuardianSection = toggleGuardianSection;
    toggleGuardianSection = function() {
        originalToggleGuardianSection();
        setTimeout(ensureGuardianRelationInput, 100); // 약간의 지연으로 DOM 업데이트 보장
    };

    // 구매자 이름 변경 시 보호자 이름 상태도 업데이트
    document.getElementById('name').addEventListener('input', function() {
        validateForm();
        updateFieldBorder(this, 'name');
        updateGuardianNameState(); // 보호자 이름 상태도 업데이트
    });

    // 필드 테두리 색상 업데이트 함수
    function updateFieldBorder(element, fieldId) {
        const value = element.value.trim();
        
        if (!value) {
            element.style.borderColor = '#f44336'; // 빨간색 - 비어있음
        } else {
            // 유효성 검사
            let isValid = false;
            switch(fieldId) {
                case 'name':
                    isValid = /^[가-힣]{1,5}$/.test(value);
                    break;
                case 'contact':
                    isValid = /^[0-9]{11}$/.test(value);
                    break;
                case 'discord':
                    isValid = /^[a-zA-Z0-9_.]{2,32}$/.test(value);
                    break;
                case 'roblox':
                    isValid = /^[a-zA-Z0-9_]{3,20}$/.test(value);
                    break;
                case 'guardianName':
                    isValid = /^[가-힣]{1,5}$/.test(value);
                    break;
                case 'guardianContact':
                    isValid = /^[0-9]{11}$/.test(value);
                    break;
                case 'guardianRelationship':
                    isValid = /^[가-힣\s]{1,10}$/.test(value);
                    break;
                            }
            
            if (isValid) {
                element.style.borderColor = '#4CAF50'; // 초록색 테두리로 변경
            } else {
                element.style.borderColor = '#f44336'; // 빨간색 - 유효하지 않음
            }
        }
    }

    
    // 보호자 섹션이 표시될 때 입력 제한 설정
    function setupGuardianInputRestrictions() {
        // 관계 필드에 한글만 입력되도록 제한
        const guardianRelationshipField = document.getElementById('guardianRelationship');
        if (guardianRelationshipField) {
            // 기존 이벤트 리스너 제거 후 새로 추가
            guardianRelationshipField.removeEventListener('input', guardianRelationshipField._inputHandler);
            guardianRelationshipField._inputHandler = function(e) {
                this.value = this.value.replace(/[^가-힣\s]/g, '');
                if (this.value.length > 10) {
                    this.value = this.value.slice(0, 10);
                }
            };
            guardianRelationshipField.addEventListener('input', guardianRelationshipField._inputHandler);
        }
    }

    // 연락처 필드에 숫자만 입력되도록 제한 및 인증 버튼 상태 업데이트
    document.getElementById('contact').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 11) {
            this.value = this.value.slice(0, 11);
        }
        updateVerifyButtonState('contact');
    });

    // 보호자 연락처 필드에 숫자만 입력되도록 제한 및 인증 버튼 상태 업데이트
    document.getElementById('guardianContact').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 11) {
            this.value = this.value.slice(0, 11);
        }
        updateVerifyButtonState('guardianContact');
    });

    // 구매자 연락처 필드 변경 시 보호자 연락처 상태도 업데이트
    document.getElementById('contact').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 11) {
            this.value = this.value.slice(0, 11);
        }
        updateVerifyButtonState('contact');
        updateVerifyButtonState('guardianContact'); // 보호자 연락처 상태도 업데이트
    });

    // 폼 제출
// 폼 제출 (258번 줄 근처)
    agreementForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // [추가] 중복 클릭 방지: 버튼이 이미 꺼져있으면 실행 안 함
        if (submitBtn.disabled) return;

        // 제출 시 모든 필드 유효성 검사 및 시각적 피드백 강제 적용
        const name = document.getElementById('name');
        const contact = document.getElementById('contact');
        const discord = document.getElementById('discord');
        const roblox = document.getElementById('roblox');
        
        // 빈 필드 확인 및 빨간색 테두리 적용
        if (!name.value.trim()) name.style.borderColor = '#f44336';
        if (!contact.value.trim()) contact.style.borderColor = '#f44336';
        if (!discord.value.trim()) discord.style.borderColor = '#f44336';
        if (!roblox.value.trim()) roblox.style.borderColor = '#f44336';
        
        // [변경] 유효성 검사 통과 못하면 중단
        if (!name.value.trim() || !contact.value.trim() || !discord.value.trim() || !roblox.value.trim()) {
            return;
        }

        // [추가] 클릭하자마자 버튼 잠금 (이게 핵심!)
        submitBtn.disabled = true;
        submitBtn.textContent = '전송 중...';

        // 모든 경우에 바로 제출
        submitFormData();
    });

    // 폼 데이터 제출 함수
    function submitFormData() {
        const formData = {
            name: document.getElementById('name').value.trim(),
            contact: document.getElementById('contact').value.trim(),
            discord: document.getElementById('discord').value.trim(),
            roblox: document.getElementById('roblox').value.trim(),
            isMinor: isMinor.checked,
            privacyAgreed: privacyAgree.checked,
            termsAgreed: termsAgree.checked,
            submittedAt: new Date().toISOString()
        };

        // 만 14세 미만인 경우 보호자 정보 추가
        if (isMinor.checked) {
            formData.guardian = {
                name: document.getElementById('guardianName').value.trim(),
                contact: document.getElementById('guardianContact').value.trim(),
                relationship: document.getElementById('guardianRelationship').value.trim()
            };
        }

        // 서버로 데이터 전송
        fetch('/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            // 완료 페이지로 이동
            window.location.href = '/complete';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        });
    }

    
    // 전화번호 인증 관련 이벤트 리스너
    contactVerifyBtn.addEventListener('click', () => startPhoneVerification('contact'));
    guardianContactVerifyBtn.addEventListener('click', () => startPhoneVerification('guardianContact'));
    closeVerifyModal.addEventListener('click', closePhoneVerificationModal);
    confirmVerificationBtn.addEventListener('click', confirmPhoneVerification);
    resendCodeBtn.addEventListener('click', () => generateVerificationCode(currentVerificationPhone));

    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', function(event) {
        if (event.target === phoneVerifyModal) {
            closePhoneVerificationModal();
        }
    });

    // 초기 상태 설정
    resetForm();
    updateButtonText();
    validateForm();
    
    // 페이지 로드 시 폼 초기화 (브라우저 자동 완성 방지)
    window.addEventListener('load', function() {
        // 폼 필드 초기화
        document.getElementById('agreementForm').reset();
        resetForm();
        
        // 브라우저 자동 완성된 값 제거
        const inputs = document.querySelectorAll('input');
        inputs.forEach(input => {
            if (input.type !== 'checkbox' && input.type !== 'radio') {
                input.value = '';
            }
        });
        
        // 초기 상태 다시 설정
        updateButtonText();
        validateForm();
    });
});

// 폼 초기화 함수
function resetForm() {
    // 모든 입력 필드 초기화
    document.getElementById('name').value = '';
    document.getElementById('contact').value = '';
    document.getElementById('discord').value = '';
    document.getElementById('roblox').value = '';
    document.getElementById('guardianName').value = '';
    document.getElementById('guardianContact').value = '';
        
    // 모든 체크박스 초기화
    document.getElementById('privacyAgree').checked = false;
    document.getElementById('termsAgree').checked = false;
    document.getElementById('isMinor').checked = false;
    document.getElementById('guardianTermsAgree').checked = false;
    
    // 스크롤 상태 초기화
    hasScrolledToBottom = false;
    guardianHasScrolledToBottom = false;
    
    // 스크롤 인디케이터 초기화
    scrollIndicator.style.display = 'block';
    scrollIndicator.innerHTML = '<span>약관을 끝까지 스크롤하여 동의 버튼을 활성화하세요</span>';
    guardianScrollIndicator.style.display = 'block';
    guardianScrollIndicator.innerHTML = '<span>약관을 끝까지 스크롤하여 동의 버튼을 활성화하세요</span>';
    
    // 약관 동의 체크박스 비활성화
    privacyAgree.disabled = true;
    termsAgree.disabled = true;
    guardianTermsAgree.disabled = true;
    
    // 약관 컨테이너 스크롤을 맨 위로
    termsContainer.scrollTop = 0;
    guardianTermsContainer.scrollTop = 0;
    
    // 보호자 섹션 숨기기
    guardianSection.style.display = 'none';
    guardianConsentSection.style.display = 'none';
    warningMessage.style.display = 'none';
    
    // 초기 필드 상태 설정 - 빈 필드는 빨간색 테두리
    const inputs = ['name', 'contact', 'discord', 'roblox'];
    inputs.forEach(id => {
        const element = document.getElementById(id);
        element.style.borderColor = '#f44336';
    });
    
    // 보호자 필드는 보이지 않을 때는 초기화하지 않음
    document.getElementById('guardianName').style.borderColor = '';
    document.getElementById('guardianContact').style.borderColor = '';
    document.getElementById('guardianRelationship').style.borderColor = '';
    
    // 인증 상태 초기화
    verifiedPhones.clear();
    contactStatus.textContent = '';
    guardianContactStatus.textContent = '';
    const guardianNameStatus = document.getElementById('guardianNameStatus');
    if (guardianNameStatus) {
        guardianNameStatus.textContent = '';
        guardianNameStatus.className = 'verification-status';
    }
    contactStatus.className = 'verification-status';
    guardianContactStatus.className = 'verification-status';
    updateVerifyButtonState('contact');
    updateVerifyButtonState('guardianContact');
    updateGuardianNameState();
}

// 전화번호 인증 관련 함수들
function updateVerifyButtonState(fieldId) {
    const phoneInput = document.getElementById(fieldId);
    const verifyBtn = fieldId === 'contact' ? document.getElementById('contactVerifyBtn') : document.getElementById('guardianContactVerifyBtn');
    const statusEl = fieldId === 'contact' ? document.getElementById('contactStatus') : document.getElementById('guardianContactStatus');
    
    if (phoneInput && verifyBtn && statusEl) {
        const phoneNumber = phoneInput.value;
        const isVerified = verifiedPhones.has(phoneNumber);
        
        // 보호자 연락처인 경우 구매자 연락처와 다른지 확인
        let isSameAsBuyer = false;
        if (fieldId === 'guardianContact') {
            const buyerContact = document.getElementById('contact').value.trim();
            if (phoneNumber === buyerContact) {
                isSameAsBuyer = true;
            }
        }
        
        if (phoneNumber.length === 11 && /^[0-9]{11}$/.test(phoneNumber)) {
            if (isVerified && !isSameAsBuyer) {
                verifyBtn.disabled = true;
                verifyBtn.textContent = '인증 완료';
                verifyBtn.classList.add('verified');
                statusEl.textContent = '인증 완료';
                statusEl.className = 'verification-status';
                phoneInput.style.borderColor = '#4CAF50';
            } else if (isSameAsBuyer) {
                verifyBtn.disabled = true;
                verifyBtn.textContent = '전화번호 인증';
                verifyBtn.classList.remove('verified');
                statusEl.textContent = '구매자 연락처와 다른 번호를 입력해주세요';
                statusEl.className = 'verification-status error';
                phoneInput.style.borderColor = '#f44336';
            } else {
                verifyBtn.disabled = false;
                verifyBtn.textContent = '전화번호 인증';
                verifyBtn.classList.remove('verified');
                statusEl.textContent = '';
                phoneInput.style.borderColor = '#4CAF50';
            }
        } else {
            verifyBtn.disabled = true;
            verifyBtn.textContent = '전화번호 인증';
            verifyBtn.classList.remove('verified');
            statusEl.textContent = '';
            phoneInput.style.borderColor = '#f44336';
        }
    }
}

// 보호자 이름 유효성 검사 함수
function updateGuardianNameState() {
    const guardianNameInput = document.getElementById('guardianName');
    const buyerNameInput = document.getElementById('name');
    const guardianNameStatus = document.getElementById('guardianNameStatus');
    
    if (guardianNameInput && buyerNameInput && guardianNameStatus) {
        const guardianName = guardianNameInput.value.trim();
        const buyerName = buyerNameInput.value.trim();
        
        if (guardianName && guardianName === buyerName) {
            guardianNameStatus.textContent = '구매자 성함과 다른 이름을 입력해주세요';
            guardianNameStatus.className = 'verification-status error';
            guardianNameInput.style.borderColor = '#f44336';
        } else {
            guardianNameStatus.textContent = '';
            guardianNameStatus.className = 'verification-status';
            if (guardianName) {
                guardianNameInput.style.borderColor = '#4CAF50';
            }
        }
    }
}


function startPhoneVerification(fieldId) {
    const phoneInput = document.getElementById(fieldId);
    const phoneNumber = phoneInput.value.trim();
    
    if (phoneNumber.length !== 11 || !/^[0-9]{11}$/.test(phoneNumber)) {
        alert('올바른 전화번호를 입력해주세요.');
        return;
    }
    
    if (verifiedPhones.has(phoneNumber)) {
        alert('이미 인증된 전화번호입니다.');
        return;
    }
    
    // 인증 코드 생성 및 모달 표시
    generateVerificationCode(phoneNumber);
    phoneVerifyModal.style.display = 'block';
    verifyStep1.style.display = 'block';
    verifyStep2.style.display = 'none';
}

function closePhoneVerificationModal() {
    phoneVerifyModal.style.display = 'none';
    if (verificationTimeout) {
        clearTimeout(verificationTimeout);
        verificationTimeout = null;
    }
}

async function confirmPhoneVerification() {
    verifyStep1.style.display = 'none';
    verifyStep2.style.display = 'block';
    
    try {
        // 서버를 통해 인증 확인
        const response = await axios.post('/api/auth/verify', {
            phoneNumber: currentVerificationPhone
        });
        
        if (response.data.verified) {
            // 인증 성공
            verifiedPhones.add(currentVerificationPhone);
            closePhoneVerificationModal();
            
            // 해당 필드의 인증 상태 업데이트
            updateVerifyButtonState(currentVerificationPhone === document.getElementById('contact').value ? 'contact' : 'guardianContact');
            
            alert('전화번호 인증이 완료되었습니다.');
        } else {
            // 인증 실패
            verifyStep1.style.display = 'block';
            verifyStep2.style.display = 'none';
            alert('인증에 실패했습니다. 코드를 다시 확인하고 전송해주세요.');
        }
    } catch (error) {
        console.error('Verification error:', error);
        verifyStep1.style.display = 'block';
        verifyStep2.style.display = 'none';
        alert('인증 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
}

function generateVerificationCode(phoneNumber) {
    // 서버에서 인증 코드 발급
    axios.post('/api/auth/issue-code', {
        phoneNumber: phoneNumber
    })
    .then(response => {
        const code = response.data.code;
        currentVerificationPhone = phoneNumber;
        currentVerificationCode = code;
        verificationCode.textContent = code;
        
        // 5분 후 인증 코드 만료
        if (verificationTimeout) {
            clearTimeout(verificationTimeout);
        }
        verificationTimeout = setTimeout(() => {
            closePhoneVerificationModal();
            alert('인증 시간이 만료되었습니다. 다시 시도해주세요.');
        }, 5 * 60 * 1000);
    })
    .catch(error => {
        // Remove debug logging
        // console.error('Code generation error:', error);
        alert('인증코드 생성에 실패했습니다. 다시 시도해주세요.');
    });
}
