document.addEventListener('DOMContentLoaded', function() {
    const guardianForm = document.getElementById('guardianForm');
    const guardianTermsContainer = document.getElementById('guardianTermsContainer');
    const guardianTermsAgree = document.getElementById('guardianTermsAgree');
    const guardianSubmitBtn = document.getElementById('guardianSubmitBtn');
    const backBtn = document.getElementById('backBtn');
    const guardianScrollIndicator = document.getElementById('guardianScrollIndicator');
    
    let hasScrolledToBottom = false;

    // 약관 스크롤 감지
    guardianTermsContainer.addEventListener('scroll', function() {
        const scrollPercentage = (guardianTermsContainer.scrollTop + guardianTermsContainer.clientHeight) / guardianTermsContainer.scrollHeight;
        
        if (scrollPercentage >= 0.95) {
            hasScrolledToBottom = true;
            guardianTermsAgree.disabled = false;
            guardianScrollIndicator.style.display = 'none';
            guardianScrollIndicator.innerHTML = '<span style="color: #28a745;">✓ 약관을 모두 읽으셨습니다</span>';
        } else {
            hasScrolledToBottom = false;
            guardianTermsAgree.disabled = true;
            guardianScrollIndicator.style.display = 'block';
            guardianScrollIndicator.innerHTML = '<span>약관을 끝까지 스크롤하여 동의 버튼을 활성화하세요</span>';
        }
    });

    // 약관 동의 체크박스
    guardianTermsAgree.addEventListener('change', function() {
        validateGuardianForm();
    });

    // 입력 필드 유효성 검사 함수
    function validateGuardianInput(input, pattern, showFeedback) {
        const value = input.value.trim();
        const isValid = pattern.test(value);
        
        if (showFeedback) {
            if (!isValid && value.length > 0) {
                input.style.borderColor = '#f44336';
            } else {
                input.style.borderColor = '';
            }
        }
        
        return isValid;
    }

    // 개별 입력 필드 유효성 검사
    function validateGuardianName() {
        const guardianName = document.getElementById('guardianName');
        const namePattern = /^[가-힣]{1,5}$/;
        return validateGuardianInput(guardianName, namePattern, false);
    }

    function validateGuardianContact() {
        const guardianContact = document.getElementById('guardianContact');
        const contactPattern = /^[0-9]{11}$/;
        return validateGuardianInput(guardianContact, contactPattern, false);
    }

    function validateGuardianRelation() {
        const guardianRelation = document.getElementById('guardianRelation');
        const relationPattern = /^[가-힣\s]{1,10}$/;
        return validateGuardianInput(guardianRelation, relationPattern, false);
    }

    // 폼 유효성 검사
    function validateGuardianForm() {
        const guardianName = document.getElementById('guardianName').value.trim();
        const guardianContact = document.getElementById('guardianContact').value.trim();
        const guardianRelation = document.getElementById('guardianRelation').value.trim();
        const termsChecked = guardianTermsAgree.checked;

        // localStorage에서 메인 폼 데이터 가져오기
        const mainFormData = JSON.parse(localStorage.getItem('mainFormData') || '{}');
        const mainName = mainFormData.name || '';
        const mainContact = mainFormData.contact || '';

        // 개별 유효성 검사 실행
        const isNameValid = validateGuardianName();
        const isContactValid = validateGuardianContact();
        const isRelationValid = validateGuardianRelation();
        
        // 보호자 정보가 메인 폼 정보와 다른지 확인 및 경고 메시지 표시
        let warningMessage = '';
        if (guardianName && guardianName === mainName) {
            warningMessage = '보호자 성함은 구매자 성함과 다르게 입력해주세요.';
            document.getElementById('guardianName').style.borderColor = '#f44336';
        } else {
            document.getElementById('guardianName').style.borderColor = '';
        }
        
        if (guardianContact && guardianContact === mainContact) {
            if (warningMessage) warningMessage += '\n';
            warningMessage += '보호자 연락처는 구매자 연락처와 다르게 입력해주세요.';
            document.getElementById('guardianContact').style.borderColor = '#f44336';
        } else {
            document.getElementById('guardianContact').style.borderColor = '';
        }

        // 경고 메시지 표시
        const warningDiv = document.getElementById('warningMessage');
        if (warningMessage) {
            warningDiv.textContent = warningMessage;
            warningDiv.style.display = 'block';
        } else {
            warningDiv.style.display = 'none';
        }

        const isNameDifferent = guardianName !== mainName;
        const isContactDifferent = guardianContact !== mainContact;

        const isFormValid = guardianName && guardianContact && guardianRelation && termsChecked && 
                           hasScrolledToBottom && isNameValid && isContactValid && isRelationValid && 
                           isNameDifferent && isContactDifferent;

        guardianSubmitBtn.disabled = !isFormValid;
    }

    // 입력 필드 변경 시 유효성 검사
    const guardianInputFields = ['guardianName', 'guardianContact', 'guardianRelation'];
    guardianInputFields.forEach(id => {
        document.getElementById(id).addEventListener('input', validateGuardianForm);
    });

    // 연락처 필드에 숫자만 입력되도록 제한
    document.getElementById('guardianContact').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^0-9]/g, '');
        if (this.value.length > 11) {
            this.value = this.value.slice(0, 11);
        }
    });

    // 관계 필드에 한글만 입력되도록 제한
    document.getElementById('guardianRelation').addEventListener('input', function(e) {
        this.value = this.value.replace(/[^가-힣\s]/g, '');
        if (this.value.length > 10) {
            this.value = this.value.slice(0, 10);
        }
    });

    // 이전으로 버튼
    backBtn.addEventListener('click', function() {
        window.history.back();
    });

    // 폼 제출
    guardianForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (guardianSubmitBtn.disabled) {
            return;
        }

        // localStorage에서 메인 폼 데이터 가져오기
        const mainFormData = JSON.parse(localStorage.getItem('mainFormData') || '{}');
        const mainName = mainFormData.name || '';
        const mainContact = mainFormData.contact || '';

        // 빈 필드 확인 및 빨간색 테두리 적용
        const guardianName = document.getElementById('guardianName');
        const guardianContact = document.getElementById('guardianContact');
        const guardianRelation = document.getElementById('guardianRelation');
        
        let hasError = false;
        
        if (!guardianName.value.trim()) {
            guardianName.style.borderColor = '#f44336';
            hasError = true;
        } else {
            guardianName.style.borderColor = '';
        }
        
        if (!guardianContact.value.trim()) {
            guardianContact.style.borderColor = '#f44336';
            hasError = true;
        } else {
            guardianContact.style.borderColor = '';
        }
        
        if (!guardianRelation.value.trim()) {
            guardianRelation.style.borderColor = '#f44336';
            hasError = true;
        } else {
            guardianRelation.style.borderColor = '';
        }

        // 보호자 정보가 메인 폼 정보와 같은지 확인
        if (guardianName.value.trim() === mainName) {
            guardianName.style.borderColor = '#f44336';
            alert('보호자 성함은 구매자 성함과 다르게 입력해주세요.');
            return;
        }
        
        if (guardianContact.value.trim() === mainContact) {
            guardianContact.style.borderColor = '#f44336';
            alert('보호자 연락처는 구매자 연락처와 다르게 입력해주세요.');
            return;
        }

        if (hasError) {
            alert('모든 필드를 입력해주세요.');
            return;
        }

        const formData = {
            name: mainFormData.name || '',
            contact: mainFormData.contact || '',
            discord: mainFormData.discord || '',
            roblox: mainFormData.roblox || '',
            isMinor: false, // 14세 미만이므로 false (체크 안 됨)
            privacyAgreed: mainFormData.privacyAgreed === true,
            termsAgreed: mainFormData.termsAgreed === true,
            submittedAt: new Date().toISOString(),
            guardian: {
                name: guardianName.value.trim(),
                contact: guardianContact.value.trim(),
                relation: guardianRelation.value.trim()
            }
        };

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
            // 제출 후 localStorage 초기화
            localStorage.removeItem('mainFormData');
            // 완료 페이지로 이동
            window.location.href = '/complete';
        })
        .catch(error => {
            console.error('Error:', error);
            alert('제출 중 오류가 발생했습니다. 다시 시도해주세요.');
        });
    });

    // 보호자 폼 초기화 함수
    function resetGuardianForm() {
        // localStorage에 메인 폼 데이터가 있는지 확인
        const mainFormData = localStorage.getItem('mainFormData');
        
        if (!mainFormData) {
            // 메인 폼 데이터가 없으면 index.html로 리디렉션
            window.location.href = '/';
            return;
        }
        
        // 스크롤 상태 초기화
        hasScrolledToBottom = false;
        
        // 스크롤 인디케이터 초기화
        guardianScrollIndicator.style.display = 'block';
        guardianScrollIndicator.innerHTML = '<span>약관을 끝까지 스크롤하여 동의 버튼을 활성화하세요</span>';
        
        // 약관 동의 체크박스 비활성화
        guardianTermsAgree.disabled = true;
        
        // 약관 컨테이너 스크롤을 맨 위로
        guardianTermsContainer.scrollTop = 0;
        
        // 입력 필드 초기화
        document.getElementById('guardianName').value = '';
        document.getElementById('guardianContact').value = '';
        document.getElementById('guardianRelation').value = '';
        document.getElementById('guardianTermsAgree').checked = false;
        
        // 입력 필드 테두리 초기화
        const inputs = ['guardianName', 'guardianContact', 'guardianRelation'];
        inputs.forEach(id => {
            document.getElementById(id).style.borderColor = '';
        });
        
        // 경고 메시지 숨기기
        const warningDiv = document.getElementById('warningMessage');
        if (warningDiv) {
            warningDiv.style.display = 'none';
        }
        
        // 제출 버튼 비활성화
        guardianSubmitBtn.disabled = true;
    }

    // 새로고침 시 localStorage 초기화
    window.addEventListener('beforeunload', function() {
        localStorage.removeItem('mainFormData');
    });

    // 초기 상태 설정
    resetGuardianForm();
    guardianSubmitBtn.textContent = '최종 제출하기';
});
