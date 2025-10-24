"""
집합건물 등기부등본 데이터 전처리 스크립트

필요 컬럼:
1. 생년월일
2. 아파트 동, 호수
3. 소유자 주소지
4. 아파트 소재지
5. 등기목적 (소유권이전: 매매, 증여, 상속)
6. 근저당설정 여부 / 근저당금액
7. 보유기간
8. 소유자에관한사항 (압류, 가압류)
9. 공유자세대수 / 단독세대수 구분
"""

import pandas as pd
import re
from datetime import datetime
import numpy as np


def load_registry_data(file_path):
    """
    등기부등본 엑셀 파일 로드
    """
    # 3행을 헤더로 사용 (실제 컬럼명이 있는 행)
    df = pd.read_excel(file_path, sheet_name='구분소유자명부', header=3)
    
    # 빈 행 제거
    df = df.dropna(how='all')
    
    return df


def extract_birth_date(df):
    """
    생년월일 추출 및 정제
    """
    # 생년월일 컬럼 (인덱스 24 - 소유자 정보의 생년월일)
    if len(df.columns) > 24:
        df['생년월일'] = df.iloc[:, 24]
    else:
        df['생년월일'] = None
    
    return df


def extract_unit_info(df):
    """
    아파트 동, 호수 추출
    """
    # 동 컬럼 (인덱스 8)
    if len(df.columns) > 8:
        df['동'] = df.iloc[:, 8]
    
    # 호수 컬럼 (인덱스 11)
    if len(df.columns) > 11:
        df['호수'] = df.iloc[:, 11]
    
    # 동호수 결합
    df['동호수'] = df.apply(
        lambda row: f"{str(row.get('동', '')).strip()} {str(row.get('호수', '')).strip()}".strip(), 
        axis=1
    )
    
    return df


def extract_owner_address(df):
    """
    소유자 주소지 추출
    """
    # 주소 컬럼 (인덱스 25 - 소유자 정보의 주소)
    if len(df.columns) > 25:
        df['소유자_주소'] = df.iloc[:, 25]
    else:
        df['소유자_주소'] = None
    
    return df


def extract_property_location(df):
    """
    아파트 소재지 추출
    """
    # 등본상의 주소 컬럼 (인덱스 5)
    if len(df.columns) > 5:
        df['아파트_소재지'] = df.iloc[:, 5]
    
    # 도로명주소도 참고용으로 저장 (인덱스 6)
    if len(df.columns) > 6:
        df['도로명주소'] = df.iloc[:, 6]
    
    return df


def extract_building_area(df):
    """
    건축물 연면적 추출
    """
    # 연면적 컬럼 (인덱스 19)
    if len(df.columns) > 19:
        df['건축물_연면적'] = df.iloc[:, 19]
    else:
        df['건축물_연면적'] = None
    
    return df


def extract_registration_purpose(df):
    """
    등기목적 추출 (매매, 증여, 상속 등)
    """
    # 등기원인 컬럼 (인덱스 31)
    if len(df.columns) > 31:
        df['등기원인'] = df.iloc[:, 31]
    
    # 등기목적 컬럼 (인덱스 27)
    if len(df.columns) > 27:
        df['등기목적'] = df.iloc[:, 27]
    
    # 등기목적 분류
    def classify_purpose(row):
        purpose = str(row.get('등기목적', ''))
        cause = str(row.get('등기원인', ''))
        combined = purpose + ' ' + cause
        
        if '매매' in combined:
            return '매매'
        elif '증여' in combined:
            return '증여'
        elif '상속' in combined:
            return '상속'
        elif '경락' in combined or '경매' in combined:
            return '경매'
        else:
            return '기타'
    
    df['등기목적_분류'] = df.apply(classify_purpose, axis=1)
    
    return df


def extract_mortgage_info(df):
    """
    근저당설정 여부 및 금액 추출
    """
    # 권리의 종류 컬럼 (인덱스 37)
    if len(df.columns) > 37:
        df['권리종류'] = df.iloc[:, 37]
    
    # 권리의 내용 컬럼 (인덱스 38)
    if len(df.columns) > 38:
        df['권리내용'] = df.iloc[:, 38]
    
    # 근저당 여부 판단
    def check_mortgage(row):
        right_type = str(row.get('권리종류', ''))
        right_content = str(row.get('권리내용', ''))
        
        if '근저당' in right_type or '근저당' in right_content:
            return 'Y'
        return 'N'
    
    df['근저당설정여부'] = df.apply(check_mortgage, axis=1)
    
    # 근저당 금액 추출 (권리내용에서 숫자 추출 - 여러 금액이 있을 경우 합산)
    def extract_mortgage_amount(row):
        if row.get('근저당설정여부') == 'Y':
            content = str(row.get('권리내용', ''))
            
            if pd.isna(row.get('권리내용')) or content == 'nan':
                return None
            
            # 한 줄에 하나씩 있는 순수 숫자들을 모두 찾기 (8자리 이상 숫자)
            # 이 패턴은 줄의 시작부터 끝까지 숫자만 있는 경우를 찾습니다
            amounts = re.findall(r'^\s*(\d{8,})\s*$', content, re.MULTILINE)
            
            if amounts:
                # 모든 금액을 합산
                total = sum(float(num) for num in amounts)
                return total
            
            # 순수 숫자가 없으면 "원", "만원", "억" 등이 붙은 패턴 찾기
            amounts_with_unit = re.findall(r'(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:원|만원|억)', content)
            if amounts_with_unit:
                total = sum(float(amount.replace(',', '')) for amount in amounts_with_unit)
                return total if total > 0 else None
        
        return None
    
    df['근저당금액'] = df.apply(extract_mortgage_amount, axis=1)
    
    return df


def extract_holding_period(df):
    """
    보유기간 추출
    """
    # 보유기간 컬럼 (인덱스 45)
    if len(df.columns) > 45:
        df['보유기간'] = df.iloc[:, 45]
    
    return df


def extract_seizure_info(df):
    """
    소유자에관한사항 (압류, 가압류) 추출
    """
    # 권리종류와 권리내용에서 압류/가압류 정보 추출
    def check_seizure(row):
        right_type = str(row.get('권리종류', ''))
        right_content = str(row.get('권리내용', ''))
        combined = right_type + ' ' + right_content
        
        seizure_types = []
        if '압류' in combined:
            seizure_types.append('압류')
        if '가압류' in combined:
            seizure_types.append('가압류')
        
        if seizure_types:
            return ', '.join(seizure_types)
        return '없음'
    
    df['압류가압류'] = df.apply(check_seizure, axis=1)
    
    return df


def classify_ownership(df):
    """
    공유자세대수 vs 단독세대수 구분
    """
    # 소유구분 컬럼 (인덱스 22)
    if len(df.columns) > 22:
        df['소유구분'] = df.iloc[:, 22]
    
    # 공유 컬럼 (인덱스 1)
    if len(df.columns) > 1:
        df['공유여부'] = df.iloc[:, 1]
    
    # 소유 형태 분류
    def classify_type(row):
        ownership = str(row.get('소유구분', ''))
        share = str(row.get('공유여부', ''))
        
        if '공유' in ownership or share == '-':
            return '공유자'
        else:
            return '단독소유자'
    
    df['소유형태'] = df.apply(classify_type, axis=1)
    
    return df


def count_ownership_types(df):
    """
    공유자세대수와 단독세대수 집계
    """
    # 동호수별로 그룹화하여 소유형태 집계
    ownership_summary = df.groupby('동호수')['소유형태'].agg([
        ('총인원수', 'count'),
        ('공유자수', lambda x: (x == '공유자').sum()),
        ('단독소유자수', lambda x: (x == '단독소유자').sum())
    ]).reset_index()
    
    # 원본 데이터에 병합
    df = df.merge(ownership_summary, on='동호수', how='left')
    
    # 세대 유형 판단
    df['세대유형'] = df.apply(
        lambda row: '공유세대' if row['공유자수'] > 1 else '단독세대',
        axis=1
    )
    
    return df


def normalize_address(address):
    """
    주소 정규화 - 비교를 위해 주소를 표준화
    
    주소 비교를 위한 정규화 규칙:
    1. 괄호 및 괄호 안 내용 제거
    2. 특수문자 제거
    3. 시/도 + 구/군 + 동/읍/면 추출
    """
    if pd.isna(address) or address == '':
        return ''
    
    address = str(address)
    original_address = address
    
    # 1. 괄호 안 내용을 먼저 추출 (동 정보가 괄호 안에 있을 수 있음)
    paren_content = ''
    paren_match = re.search(r'\(([^)]*)\)', address)
    if paren_match:
        paren_content = paren_match.group(1)
    
    # 괄호 내용 제거
    address = re.sub(r'\([^)]*\)', '', address)
    
    # 2. 특수문자 제거 (하이픈, 쉼표, 점 등)
    address = re.sub(r'[-,.]', ' ', address)
    
    # 3. 시/도 추출
    sido = ''
    sido_patterns = ['서울특별시', '부산광역시', '대구광역시', '인천광역시', 
                     '광주광역시', '대전광역시', '울산광역시', '세종특별자치시',
                     '경기도', '강원도', '충청북도', '충청남도', '전라북도', 
                     '전라남도', '경상북도', '경상남도', '제주특별자치도']
    
    for pattern in sido_patterns:
        if pattern in address:
            sido = pattern
            address = address.replace(pattern, ' ', 1)
            break
    
    # 시/도 이름 단순화
    sido = sido.replace('특별시', '').replace('광역시', '').replace('특별자치시', '').replace('특별자치도', '').replace('도', '')
    
    # 4. 구/군/시 추출
    sigungu = ''
    sigungu_match = re.search(r'([가-힣]+[시군구])', address)
    if sigungu_match:
        sigungu = sigungu_match.group(1)
    
    # 5. 동/읍/면/가 추출
    # 괄호 안 내용에서 먼저 찾기
    dong = ''
    if paren_content:
        dong_match = re.search(r'([가-힣]+[동읍면가])', paren_content)
        if dong_match:
            dong = dong_match.group(1)
    
    # 괄호 안에서 못 찾았으면 일반 주소에서 찾기
    if not dong:
        # 숫자가 없는 동/읍/면/가만 추출 (예: 구의동, 능동, 능서면)
        dong_match = re.search(r'([가-힣]+[동읍면가])', address)
        if dong_match:
            dong = dong_match.group(1)
    
    # 결합
    normalized = sido + sigungu + dong
    
    return normalized


def classify_residence_type(df):
    """
    실거주 vs 투자 구분
    
    소유자 주소와 아파트 소재지를 비교하여 구분
    1. 동호수가 같으면: 실거주
    2. 지번이 같으면: 실거주
    3. 정규화된 주소가 같으면: 실거주
    4. 그 외: 투자
    """
    def extract_dong_ho(address):
        """주소에서 동호수 추출 (예: 1동 101호, 제1동 제101호)"""
        if pd.isna(address):
            return None, None
        
        address = str(address)
        
        # 동 추출 (숫자+동 패턴)
        dong_patterns = [
            r'제?(\d+)동',  # 1동, 제1동
            r'(\d+)동'
        ]
        dong = None
        for pattern in dong_patterns:
            match = re.search(pattern, address)
            if match:
                dong = match.group(1)
                break
        
        # 호수 추출 (숫자+호 패턴)
        ho_patterns = [
            r'제?(\d+(?:-\d+)?)호',  # 101호, 제101호, 102-1호
            r'(\d+(?:-\d+)?)호'
        ]
        ho = None
        for pattern in ho_patterns:
            match = re.search(pattern, address)
            if match:
                ho = match.group(1)
                break
        
        return dong, ho
    
    def extract_jibun(address):
        """주소에서 지번 추출 (예: 76-1, 41)"""
        if pd.isna(address):
            return None
        
        address = str(address)
        
        # 동/읍/면/가 뒤의 숫자-숫자 또는 숫자 패턴
        jibun_patterns = [
            r'[동읍면가]\s+(\d+(?:-\d+)?)',  # 구의동 76-1
            r'[동읍면가](\d+(?:-\d+)?)',     # 구의동76-1
        ]
        
        for pattern in jibun_patterns:
            match = re.search(pattern, address)
            if match:
                return match.group(1)
        
        return None
    
    def compare_addresses(row):
        owner_addr = row.get('소유자_주소', '')
        property_addr = row.get('아파트_소재지', '')
        
        # 주소 정보가 없으면 구분 불가
        if pd.isna(owner_addr) or pd.isna(property_addr) or owner_addr == '' or property_addr == '':
            return '정보없음'
        
        # 1. 동호수 비교
        owner_dong, owner_ho = extract_dong_ho(owner_addr)
        property_dong, property_ho = extract_dong_ho(property_addr)
        
        # 동과 호가 모두 있는 경우
        if owner_ho and property_ho:
            # 호수가 일치하면 실거주
            if owner_ho == property_ho:
                # 동 정보가 있으면 동도 확인
                if owner_dong and property_dong:
                    if owner_dong == property_dong:
                        return '실거주'
                else:
                    # 동 정보가 없으면 호수만으로 판단
                    return '실거주'
            else:
                # 호수가 다르면 무조건 투자 (같은 동이어도)
                return '투자'
        
        # 2. 지번 비교 (동호수 정보가 없을 때만)
        if not (owner_ho and property_ho):
            owner_jibun = extract_jibun(owner_addr)
            property_jibun = extract_jibun(property_addr)
            
            # 지번이 모두 있고 일치하면 실거주
            if owner_jibun and property_jibun:
                if owner_jibun == property_jibun:
                    # 추가로 시/구까지 같은지 확인
                    owner_norm = normalize_address(owner_addr)
                    property_norm = normalize_address(property_addr)
                    
                    # 최소한 구까지는 같아야 함
                    if len(owner_norm) >= 6 and len(property_norm) >= 6:
                        if owner_norm[:6] == property_norm[:6]:  # 시+구 비교
                            return '실거주'
        
        # 3. 정규화된 주소 비교는 참고용으로만 (동호수가 없을 때만 사용)
        if not (owner_ho or property_ho):
            normalized_owner = normalize_address(owner_addr)
            normalized_property = normalize_address(property_addr)
            
            # 정규화된 주소가 비어있으면 구분 불가
            if not normalized_owner or not normalized_property:
                return '정보없음'
            
            # 정규화된 주소가 완전히 일치
            if normalized_owner == normalized_property:
                return '실거주(추정)'  # 동호수 없이 동만 같음
        
        # 4. 같은 구인지 확인 (참고용)
        normalized_owner = normalize_address(owner_addr)
        normalized_property = normalize_address(property_addr)
        
        if normalized_owner and normalized_property:
            if len(normalized_owner) >= 6 and len(normalized_property) >= 6:
                if normalized_owner[:6] == normalized_property[:6]:  # 시+구까지만 비교
                    return '같은구'
        
        # 5. 그 외는 투자
        return '투자'
    
    df['거주형태'] = df.apply(compare_addresses, axis=1)
    
    return df


def group_by_household(df):
    """
    세대별로 그룹화하여 1세대 = 1행으로 정리
    
    - 각 세대(동호수)별로 첫 번째 소유자를 대표로 선정
    - 공유자 수는 별도 컬럼에 표기
    """
    # 소유자 이름 추출 (인덱스 23)
    if len(df.columns) > 23:
        df['소유자명'] = df.iloc[:, 23]
    
    grouped_rows = []
    
    # 동호수별로 그룹화
    for dong_ho, group in df.groupby('동호수'):
        # 첫 번째 행을 대표로 선정
        representative = group.iloc[0].copy()
        
        # 거주형태는 전체 그룹에서 판단 (한 명이라도 실거주면 실거주)
        residence_types = group['거주형태'].unique()
        if '실거주' in residence_types:
            representative['거주형태'] = '실거주'
        elif '실거주(추정)' in residence_types:
            representative['거주형태'] = '실거주(추정)'
        else:
            representative['거주형태'] = group['거주형태'].mode()[0] if len(group['거주형태'].mode()) > 0 else '투자'
        
        grouped_rows.append(representative)
    
    # 데이터프레임으로 변환
    df_grouped = pd.DataFrame(grouped_rows)
    
    return df_grouped


def create_final_dataset(df):
    """
    최종 필요 컬럼만 추출하여 깔끔한 데이터셋 생성
    """
    final_columns = [
        '소유자명',
        '생년월일',
        '동호수',
        '소유자_주소',
        '아파트_소재지',
        '도로명주소',
        '건축물_연면적',
        '거주형태',
        '등기목적_분류',
        '등기원인',
        '근저당설정여부',
        '근저당금액',
        '보유기간',
        '압류가압류',
        '소유형태',
        '세대유형',
        '총인원수',
        '공유자수',
        '단독소유자수'
    ]
    
    # 존재하는 컬럼만 선택
    existing_columns = [col for col in final_columns if col in df.columns]
    df_final = df[existing_columns].copy()
    
    return df_final


def preprocess_registry_data(file_path, output_path=None):
    """
    전체 전처리 파이프라인 실행
    """
    print("="*80)
    print("등기부등본 데이터 전처리 시작")
    print("="*80)
    
    # 1. 데이터 로드
    print("\n[1/11] 데이터 로딩 중...")
    df = load_registry_data(file_path)
    print(f"   로드된 데이터: {len(df)}행")
    
    # 2. 생년월일 추출
    print("\n[2/11] 생년월일 추출 중...")
    df = extract_birth_date(df)
    
    # 3. 동호수 추출
    print("\n[3/11] 동호수 정보 추출 중...")
    df = extract_unit_info(df)
    
    # 4. 소유자 주소 추출
    print("\n[4/11] 소유자 주소 추출 중...")
    df = extract_owner_address(df)
    
    # 5. 아파트 소재지 추출
    print("\n[5/11] 아파트 소재지 추출 중...")
    df = extract_property_location(df)
    
    # 5-1. 건축물 연면적 추출
    print("\n[5-1/11] 건축물 연면적 추출 중...")
    df = extract_building_area(df)
    
    # 6. 등기목적 추출
    print("\n[6/11] 등기목적 분류 중...")
    df = extract_registration_purpose(df)
    
    # 7. 근저당 정보 추출
    print("\n[7/11] 근저당 정보 추출 중...")
    df = extract_mortgage_info(df)
    
    # 8. 보유기간 추출
    print("\n[8/11] 보유기간 추출 중...")
    df = extract_holding_period(df)
    
    # 9. 압류/가압류 정보 추출
    print("\n[9/11] 압류/가압류 정보 추출 중...")
    df = extract_seizure_info(df)
    
    # 10. 소유형태 분류
    print("\n[10/11] 소유형태 분류 중...")
    df = classify_ownership(df)
    df = count_ownership_types(df)
    
    # 11. 거주형태 분류 (실거주 vs 투자)
    print("\n[11/13] 거주형태 분류 중...")
    df = classify_residence_type(df)
    
    # 12. 세대별 그룹화 (1세대 = 1행)
    print("\n[12/13] 세대별 그룹화 중...")
    df = group_by_household(df)
    print(f"   그룹화 후: {len(df)}개 세대")
    
    # 최종 데이터셋 생성
    print("\n최종 데이터셋 생성 중...")
    df_final = create_final_dataset(df)
    
    # 결과 출력
    print("\n" + "="*80)
    print("전처리 완료!")
    print("="*80)
    print(f"\n최종 데이터 행 수: {len(df_final)}")
    print(f"최종 데이터 열 수: {len(df_final.columns)}")
    print(f"\n컬럼 목록:")
    for i, col in enumerate(df_final.columns, 1):
        print(f"  {i}. {col}")
    
    # 기본 통계
    print("\n" + "="*80)
    print("기본 통계")
    print("="*80)
    print(f"\n등기목적 분류:")
    print(df_final['등기목적_분류'].value_counts())
    
    print(f"\n근저당설정 여부:")
    print(df_final['근저당설정여부'].value_counts())
    
    print(f"\n소유형태:")
    print(df_final['소유형태'].value_counts())
    
    print(f"\n세대유형:")
    print(df_final['세대유형'].value_counts())
    
    print(f"\n압류/가압류:")
    print(df_final['압류가압류'].value_counts())
    
    print(f"\n거주형태:")
    print(df_final['거주형태'].value_counts())
    
    # 파일 저장
    if output_path:
        df_final.to_excel(output_path, index=False, engine='openpyxl')
        print(f"\n결과 파일 저장: {output_path}")
    
    return df_final


if __name__ == "__main__":
    # 파일 경로 설정
    input_file = '/mnt/user-data/uploads/4__집합건물_등기부등본을_이용한__구분소유자명부_작성사례_샘플_.xlsx'
    output_file = '/mnt/user-data/outputs/전처리_결과.xlsx'
    
    # 전처리 실행
    df_result = preprocess_registry_data(input_file, output_file)
    
    # 결과 미리보기
    print("\n" + "="*80)
    print("결과 데이터 미리보기 (처음 10행)")
    print("="*80)
    print(df_result.head(10).to_string())
