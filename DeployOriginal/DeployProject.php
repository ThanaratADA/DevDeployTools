
<?php if( $_SERVER['REQUEST_METHOD'] == 'GET' ){ ?>
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AdaSoft Deploy Tool - Original</title>
    <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="../assets/css/adasoft-theme.css">
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.5.1/jquery.min.js"></script>
</head>
<body style="background: linear-gradient(135deg, #0f766e 0%, #047857 100%); min-height: 100vh; padding: 20px 0;">

    <div class="container" style="max-width: 1400px;">
        
        <!-- Header -->
        <div class="text-center mb-3">
            <h1 class="text-white mb-2">
                <i class="fas fa-rocket"></i> AdaSoft Deploy Tool
            </h1>
            <p class="text-white-50">Original Version - Simple & Fast</p>
            <a href="../index.php" class="btn btn-outline-light btn-sm">
                <i class="fas fa-arrow-left"></i> กลับหน้าหลัก
            </a>
        </div>

        <!-- Main Card -->
        <div class="card card-custom shadow-lg">
            <div class="card-header card-header-custom">
                <i class="fas fa-box"></i> Deploy Configuration
            </div>
            <div class="card-body">
                <form id="ofmDeployProject" method="POST">
                    
                    <!-- Row 1: Source & Destination -->
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label><i class="fas fa-folder-open"></i> ต้นทาง (Source Path):</label>
                            <div class="input-group">
                                <input class="form-control form-control-custom" type="text" id="oetFromPath" name="oetFromPath" required placeholder="D:\WebServer\Apache24\htdocs\AdaStoreBack">
                                <div class="input-group-append">
                                    <button class="btn btn-warning-custom" type="button" onclick="document.getElementById('folderSourceInput').click()" title="เลือก Folder">
                                        <i class="fas fa-folder-open"></i>
                                    </button>
                                </div>
                                <input type="file" id="folderSourceInput" webkitdirectory directory style="display: none;" onchange="handleFolderSelect(this, 'oetFromPath')">
                            </div>
                            <small class="text-muted"><i class="fas fa-info-circle"></i> ระบุ path ของโปรเจ็คต้นทาง</small>
                        </div>
                        <div class="col-md-6">
                            <label><i class="fas fa-folder"></i> ปลายทาง (Destination Path):</label>
                            <div class="input-group">
                                <input class="form-control form-control-custom" type="text" id="oetToPath" name="oetToPath" required placeholder="D:\PackFile_Deploy">
                                <div class="input-group-append">
                                    <button class="btn btn-warning-custom" type="button" onclick="document.getElementById('folderDestInput').click()" title="เลือก Folder">
                                        <i class="fas fa-folder-open"></i>
                                    </button>
                                </div>
                                <input type="file" id="folderDestInput" webkitdirectory directory style="display: none;" onchange="handleFolderSelect(this, 'oetToPath')">
                            </div>
                            <small class="text-muted"><i class="fas fa-info-circle"></i> ระบุ path ที่จะเก็บไฟล์ที่ pack แล้ว</small>
                        </div>
                    </div>

                    <!-- Row 2: Version -->
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label><i class="fas fa-tag"></i> เวอร์ชั่น (Version):</label>
                            <input class="form-control form-control-custom" type="text" id="oetVersionDeploy" name="oetVersionDeploy" required placeholder="5.1.0.0">
                            <small class="text-muted"><i class="fas fa-info-circle"></i> รูปแบบ: XX.XX.XX.XX</small>
                        </div>
                    </div>

                    <!-- Row 3: File Paths & Readme -->
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label><i class="fas fa-file-code"></i> รายการไฟล์ (File Paths):</label>
                            <textarea class="form-control form-control-custom files-textarea" id="otaFilePath" name="otaFilePath" required placeholder="application/modules/example/controllers/Example.php&#10;application/modules/example/models/Example_model.php&#10;assets/js/example.js" rows="8"></textarea>
                            <small class="text-muted">
                                <i class="fas fa-lightbulb"></i> ระบุ path ของไฟล์แต่ละไฟล์ (ทีละบรรทัด)
                            </small>
                        </div>
                        <div class="col-md-6">
                            <label><i class="fas fa-sticky-note"></i> Readme:</label>
                            <textarea class="form-control form-control-custom" id="otaReadMe" name="otaReadMe" required placeholder="Deploy AdaStoreBack&#10;Version 5.1.0.0&#10;&#10;ปัญหา:&#10;- ระบุปัญหาที่นี่&#10;&#10;แก้ไข:&#10;- ระบุวิธีแก้ไขที่นี่" rows="8"></textarea>
                            <small class="text-muted"><i class="fas fa-info-circle"></i> เนื้อหาที่จะบันทึกในไฟล์ Readme.txt</small>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <div class="text-center mt-3">
                        <button class="btn btn-success-custom btn-custom btn-lg" id="obtSubmit" type="submit">
                            <i class="fas fa-box-open"></i> Pack Files
                        </button>
                    </div>

                </form>
            </div>
        </div>

        <!-- Log Output -->
        <div id="odvLog" class="mt-4"></div>

    </div>

<script>

    // Function สำหรับจัดการการเลือก folder
    function handleFolderSelect(input, targetInputId) {
        if (input.files && input.files.length > 0) {
            // ดึง path จากไฟล์แรกที่เลือก
            const file = input.files[0];
            let folderPath = file.webkitRelativePath || file.name;
            
            // ตัด filename ออกเพื่อเหลือแค่ folder path
            const lastSlash = folderPath.lastIndexOf('/');
            if (lastSlash !== -1) {
                folderPath = folderPath.substring(0, lastSlash);
            }
            
            // แสดง path ในฟิลด์
            // หมายเหตุ: เนื่องจากข้อจำกัดของ browser จะได้เฉพาะ relative path
            // ผู้ใช้ต้องแก้ไขเป็น absolute path เอง
            document.getElementById(targetInputId).value = folderPath;
            
            // แสดง alert แจ้งเตือนให้ผู้ใช้ตรวจสอบ path
            alert('กรุณาตรวจสอบและแก้ไข path ให้เป็น absolute path ที่ถูกต้อง\nเช่น: D:\\WebServer\\Apache24\\htdocs\\' + folderPath);
        }
    }

    $('#ofmDeployProject').on('submit', function(e) {

        e.preventDefault();

        // Show loading
        $('#obtSubmit').html('<i class="fas fa-spinner fa-spin"></i> กำลัง Pack Files...').prop('disabled', true);
        $('#odvLog').html('<div class="card card-custom"><div class="card-body text-center"><div class="spinner"></div><p class="text-muted mt-3">กำลังประมวลผล...</p></div></div>');

        $.ajax({
            url : window.location,
            type: "POST",
            data: $(this).serialize(),
            success: function (data) {
                $("#odvLog").html('<div class="card card-custom"><div class="card-header card-header-custom"><i class="fas fa-list"></i> Deploy Log</div><div class="card-body" style="max-height: 500px; overflow-y: auto;">' + data + '</div></div>');
                $('#obtSubmit').html('<i class="fas fa-box-open"></i> Pack Files').prop('disabled', false);
            },
            error: function (jXHR, textStatus, errorThrown) {
                $("#odvLog").html('<div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i> Error: ' + errorThrown + '</div>');
                $('#obtSubmit').html('<i class="fas fa-box-open"></i> Pack Files').prop('disabled', false);
            }
        });
        
    });

</script>

</body>
</html>

<?php } ?>

<?php

    if( $_SERVER['REQUEST_METHOD'] == 'POST' ){

        $tToPath    = $_POST['oetToPath'];
        $tFromPath  = $_POST['oetFromPath'];
        $tVersion   = $_POST['oetVersionDeploy'];
        $tReadMe    = $_POST['otaReadMe'];
        $aFilePath  = explode("\r\n",$_POST['otaFilePath']);
        $tFolder    = "AdaStoreBack-".$tVersion."-".date("dmY");
        $tVFormat   = "Version ".$tVersion." ".date("dmY");
        $tWebApp    = "StoreBack ( Web Application )";
        // array_push($aFilePath,'/version_deploy.txt');

        foreach( $aFilePath as $nKey => $tValue ){
            
            $tFilePath      = ( substr($tValue, 0, 1) != "/" ? "/".$tValue : $tValue );
            $path_parts     = pathinfo($tFilePath);
            $tToPathFile    = $tToPath."/".$tFolder."/".$tWebApp."/".$path_parts['dirname']."/".$path_parts['basename'];
            $tToPathDir     = $tToPath."/".$tFolder."/".$tWebApp."/".$path_parts['dirname'];
            $tFromDir       = $tFromPath.$tFilePath;

            if( is_dir($tFromDir) ){    // Folder
                FSxCNCloneFolders($tFromDir,$tToPathFile);
            }else{                      // File
                if( !file_exists($tToPathDir) ){
                    mkdir($tToPathDir, 0777, true);
                }
    
                if( copy($tFromDir, $tToPathFile) ){
                    echo "<div class='alert alert-success'><i class='fas fa-check-circle'></i> $tFromDir</div>";
                }else{
                    echo "<div class='alert alert-danger'><i class='fas fa-times-circle'></i> $tFromDir</div>";
                }
            }

        }

        // เขียนไฟล์ readme.txt
        $oMyfile = fopen($tToPath."/".$tFolder."/Readme.txt", "w") or die("Unable to open file!");
        fwrite($oMyfile, $tReadMe);
        fclose($oMyfile);

        // เขียนไฟล์ version_deploy.txt
        $oMyfile = fopen($tToPath."/".$tFolder."/".$tWebApp."/version_deploy.txt", "w") or die("Unable to open file!");
        fwrite($oMyfile, $tVFormat);
        fclose($oMyfile);

        function FSxCNCloneFolders($ptFrom, $ptTo) {  

            $dir = opendir($ptFrom);  
            mkdir($ptTo, 0777, true);  
           
            foreach (scandir($ptFrom) as $tFile) {  
                if (( $tFile != '.' ) && ( $tFile != '..' )) {  
                    $tFromDir       = $ptFrom . '/' . $tFile;
                    $tToPathFile    = $ptTo . '/' . $tFile;
    
                    if( is_dir($tFromDir) ){  
                        FSxCNCloneFolders($tFromDir, $tToPathFile);  
                    }else{  
                        if( copy($tFromDir, $tToPathFile) ){
                            echo "<div class='alert alert-success'><i class='fas fa-check-circle'></i> $tFromDir</div>";
                        }else{
                            echo "<div class='alert alert-danger'><i class='fas fa-times-circle'></i> $tFromDir</div>";
                        } 
                    }  
                }  
            }
            closedir($dir); 
        }

    }

?>