

document.querySelector('#main-database-file').addEventListener('change', onMainDataUpload);
document.querySelector('#applying-database-file').addEventListener('change', onApplyingDataUpload);
document.getElementById('filter-me-daddy').addEventListener('click', filterStudents);

let firstFileUploaded = false;
let secondFileUploaded = false;

let placedStudentsList;
function onMainDataUpload(e) {
	const file = e.target.files[0];
	document.getElementById('placed-file-name').innerHTML = file.name;

	const reader = new FileReader();
	reader.onload = function (e) {
		const data = e.target.result;
		const workbook = XLSX.read(data, {
			type: 'binary'
		});

		placedStudentsList = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[workbook.SheetNames[0]]);
		document.getElementById('placed-filter-options').classList.remove('hidden');

		firstFileUploaded = true;
	};

	reader.onerror = function(error) {
		showErrorPopupWithText(error);
		console.error(error);
	};

	reader.readAsBinaryString(file);
}





let applyingStudentsList;
function onApplyingDataUpload(e) {
	const file = e.target.files[0];
	document.getElementById('applying-file-name').innerHTML = file.name;
	const reader = new FileReader();
	reader.onload = function (e) {
		const data = e.target.result;
		const workbook = XLSX.read(data, {
			type: 'binary'
		});
		applyingStudentsList = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[workbook.SheetNames[0]]);
		generateColumnSelectOptions(applyingStudentsList);
		document.getElementById('applying-filter-options').classList.remove('hidden');

		secondFileUploaded = true;
	};
	reader.onerror = function(error) {
		showErrorPopupWithText(error);
		console.error(error);
	};
	reader.readAsBinaryString(file);
	
}

function generateColumnSelectOptions(rows) {
	const columnList = Object.keys(rows[0])
	columnList.forEach(function(column) {
		const filterOption = document.createElement('div');
		const columnKey = column.replace(/ /g, '-');
		filterOption.className = `z-50 flex items-center filter-switch-item-applying flex relative h-8 my-2 border border-white`;
		filterOption.innerHTML = `
			<input type="radio" name="applying-filter" value="${column}" id="applying-${columnKey}" class="sr-only" checked>
			<label for="applying-${columnKey}" class="flex items-center justify-center px-[8px] py-[6px] text-xs sm:text-sm text-white hover:text-gray-800 transition-colors duration-200">
				${column}
			</label>
		`
		document.getElementById('applying-filter-options').append(filterOption)
	})
}

function filterStudents() {
	let placedFilterOption = null;
	for (const option of document.querySelectorAll('#placed-filter-options input')) {
		if(option.checked) {
			placedFilterOption = option.value;
			break;
		}
	}

	let applyingFilterOption = null;
	for (const option of document.querySelectorAll('#applying-filter-options input')) {
		if(option.checked) {
			applyingFilterOption = option.value;
			break;
		}
	}

	if(!firstFileUploaded) {
		showErrorPopupWithText("Placement data not uploaded");
		console.error("Placement data not uploaded");
		return;
	}

	if(!secondFileUploaded) {
		showErrorPopupWithText("Applying Student data not uploaded");
		console.error("Applying Student data not uploaded");
		return;
	}

	if(!placedFilterOption || !applyingFilterOption) {
		showErrorPopupWithText("Please elect a filter paramater");
		console.error("Please select a filter paramater");
		return;
	}

	if(!document.getElementById('incoming-company-ctc').value) {
		showErrorPopupWithText("Please enter Incoming Company's CTC");
		console.error("Please enter Incoming Company's CTC");
		return;
	}

	filter(placedFilterOption, applyingFilterOption);
}

function filter(placedFilterOption, applyingFilterOption) {
	let filteredStudentsList = []
	const incomingCompanyCTC = Number(document.getElementById('incoming-company-ctc').value);
	applyingStudentsList.forEach(function(student) {
		let flag = false;
		for (const placedStudent of placedStudentsList) {
			if(placedStudent[placedFilterOption]?.trim().toUpperCase() == student[applyingFilterOption]?.trim().toUpperCase()) {
				flag = true;
				const firstPackage = placedStudent["Package 1"]?.split(" ")[0];
				if(placedStudent["Company 1"] && placedStudent["Company 2"]) {
					filteredStudentsList.push({
						"Student": student[applyingFilterOption],
						"Reason": "INELIGIBLE. 2 offers completed"
					})
				} else if(Math.abs(firstPackage - incomingCompanyCTC) <= 1.5) {
					filteredStudentsList.push({
						"Student": student[applyingFilterOption],
						"Reason": "INELIGIBLE. Incoming company CTC's within 1.5 lakhs of first package"
					})
				} else if(firstPackage > incomingCompanyCTC) {
					filteredStudentsList.push({
						"Student": student[applyingFilterOption],
						"Reason": "INELIGIBLE. First package greater than incoming company CTC"
					})
				} else {
					filteredStudentsList.push({
						"Student": student[applyingFilterOption],
						"Reason": "Eligible, only 1 offer taken"
					})
				}
				break;
			}
		}
		if(!flag) {
			filteredStudentsList.push({
				"Student": student[applyingFilterOption],
				"Reason": "Eligible, not yet placed"
			})
		}
	})

	console.log(filteredStudentsList)
	createExcelFile(filteredStudentsList);
	document.getElementById('filter-me-daddy').innerHTML = 'Filter again? 😏';
}




function createExcelFile(filteredStudentsList) {
	const fileName = `Filtered List ${new Date()}.xlsx`;
	const ws = XLSX.utils.json_to_sheet(filteredStudentsList);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'Filtered Students');
	XLSX.writeFile(wb, fileName);
}


let popupTimeout = null;
function showSuccessPopupWithText(popupText) {
	if(popupTimeout) clearTimeout(popupTimeout);
	document.querySelector('#success-popup-txt').innerHTML = popupText;
	document.querySelector('#error-popup').classList.replace('translate-x-[4px]', '-translate-x-full');
	document.querySelector('#success-popup').classList.replace('-translate-x-full', 'translate-x-[4px]');
	popupTimeout = setTimeout(() => {
		document.querySelector('#success-popup').classList.replace('translate-x-[4px]', '-translate-x-full');
	}, 5000);
}

function showErrorPopupWithText(popupText) {
	if(popupTimeout) clearTimeout(popupTimeout);
	document.querySelector('#error-popup-txt').innerHTML = popupText;
	document.querySelector('#success-popup').classList.replace('translate-x-[4px]', '-translate-x-full');
	document.querySelector('#error-popup').classList.replace('-translate-x-full', 'translate-x-[4px]');
	popupTimeout = setTimeout(() => {
		document.querySelector('#error-popup').classList.replace('translate-x-[4px]', '-translate-x-full');
	}, 5000);
}