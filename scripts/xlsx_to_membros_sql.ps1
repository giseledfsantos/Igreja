param(
  [Parameter(Mandatory = $true)]
  [string]$XlsxPath,

  [Parameter(Mandatory = $true)]
  [string]$OutSqlPath,

  [string]$SchemaJsonPath = 'd:\Dev\Igreja\wwwroot\schema.json',

  [string]$TargetTable = 'public.membros',

  [int]$SheetIndex = 0,

  [string]$SheetName = ''
)

$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.IO.Compression.FileSystem

function Get-ZipText([System.IO.Compression.ZipArchive]$Zip, [string]$EntryName) {
  $e = $Zip.Entries | Where-Object FullName -eq $EntryName
  if (-not $e) { return $null }
  $sr = [System.IO.StreamReader]::new($e.Open())
  try { return $sr.ReadToEnd() } finally { $sr.Close() }
}

function Normalize-Key([string]$s) {
  if ($null -eq $s) { return '' }
  $v = $s.Trim().ToLowerInvariant()
  try {
    $v = $v.Normalize([Text.NormalizationForm]::FormD)
    $v = [regex]::Replace($v, '\p{M}+', '')
  } catch {}
  $v = [regex]::Replace($v, '[^a-z0-9]+', '')
  return $v
}

function ColToIndex([string]$col) {
  $n = 0
  foreach ($ch in $col.ToCharArray()) {
    $n = ($n * 26) + ([int][char]$ch - [int][char]'A' + 1)
  }
  return $n
}

function CellRefToColIndex([string]$r) {
  if (-not $r) { return 0 }
  $m = [regex]::Match($r, '^[A-Z]+')
  if (-not $m.Success) { return 0 }
  return (ColToIndex $m.Value)
}

function ExcelSerialToDateTime([double]$serial) {
  $base = [datetime]'1899-12-30'
  return $base.AddDays($serial)
}

function IsDateNumFmtId([int]$numFmtId) {
  $builtin = @(14, 15, 16, 17, 18, 19, 20, 21, 22, 45, 46, 47)
  return $builtin -contains $numFmtId
}

function IsDateFormatCode([string]$formatCode) {
  if (-not $formatCode) { return $false }
  $c = $formatCode.ToLowerInvariant()
  $c = [regex]::Replace($c, '"[^"]*"', '')
  $c = [regex]::Replace($c, '\[[^\]]*\]', '')
  $c = $c.Replace('\', '')
  return ($c -match '[dmyh]' -and $c -notmatch '0\.0+')
}

function Escape-SqlString([string]$s) {
  if ($null -eq $s) { return 'NULL' }
  return "'" + ($s -replace "'", "''") + "'"
}

function To-BoolOrNull([string]$s) {
  $v = ''
  if ($null -ne $s) { $v = $s.ToString() }
  $v = $v.Trim().ToLowerInvariant()
  if ($v -eq '') { return $null }
  if (@('1', 'true', 'sim', 's', 'x', 'yes', 'y').Contains($v)) { return $true }
  if (@('0', 'false', 'nao', 'não', 'n', 'no').Contains($v)) { return $false }
  return $null
}

if (-not (Test-Path -LiteralPath $XlsxPath)) { throw "Arquivo não encontrado: $XlsxPath" }
if (-not (Test-Path -LiteralPath $SchemaJsonPath)) { throw "Schema não encontrado: $SchemaJsonPath" }

$schema = Get-Content -LiteralPath $SchemaJsonPath -Raw | ConvertFrom-Json
$membrosTable = $schema.tables | Where-Object { $_.name -eq 'membros' } | Select-Object -First 1
if (-not $membrosTable) { throw 'Tabela "membros" não encontrada no schema.json' }

$fields = @{}
foreach ($f in $membrosTable.fields) {
  $key = [string]$f.key
  if (-not $key) { continue }
  $fields[$key] = $f
}

$requiredKeys = @()
foreach ($f in $membrosTable.fields) {
  if ($f.required -eq $true -and $f.key) { $requiredKeys += [string]$f.key }
}

$labelToKey = @{}
foreach ($f in $membrosTable.fields) {
  $k = [string]$f.key
  $l = [string]$f.label
  if (-not $k -or -not $l) { continue }
  $labelToKey[(Normalize-Key $l)] = $k
}

$synonyms = @{
  (Normalize-Key 'Matrícula') = 'matricula'
  (Normalize-Key 'Nome') = 'nome'
  (Normalize-Key 'Sexo') = 'sexo'
  (Normalize-Key 'Estado Civil') = 'estado_civil'
  (Normalize-Key 'Data de Nascimento') = 'data_nascimento'
  (Normalize-Key 'Nascimento') = 'data_nascimento'
  (Normalize-Key 'Grupo') = '__grupo_nome'
  (Normalize-Key 'Situação Sede') = 'cargo_ministerial'
  (Normalize-Key 'Obs') = 'observacoes'
  (Normalize-Key 'Cidade de Nascimento') = 'cidade_nascimento'
  (Normalize-Key 'UF Nascimento') = 'uf_nascimento'
  (Normalize-Key 'Nome do Pai') = 'nome_pai'
  (Normalize-Key 'Pai Evangélico') = 'pai_evangelico'
  (Normalize-Key 'Nome da Mãe') = 'nome_mae'
  (Normalize-Key 'Mãe Evangélica') = 'mae_evangelica'
  (Normalize-Key 'Endereço') = 'endereco'
  (Normalize-Key 'Número') = 'numero'
  (Normalize-Key 'Bairro') = 'bairro'
  (Normalize-Key 'Cidade') = 'cidade'
  (Normalize-Key 'UF') = 'uf'
  (Normalize-Key 'CEP') = 'cep'
  (Normalize-Key 'Email') = 'email'
  (Normalize-Key 'Telefone Fixo') = 'telefone_fixo'
  (Normalize-Key 'Celular') = 'celular'
  (Normalize-Key 'Identidade') = 'identidade'
  (Normalize-Key 'Órgão Emissor') = 'orgao_emissor'
  (Normalize-Key 'CPF') = 'cpf'
  (Normalize-Key 'Título de Eleitor') = 'titulo_eleitor'
  (Normalize-Key 'Zona') = 'zona'
  (Normalize-Key 'Seção') = 'sessao'
  (Normalize-Key 'Certidão Tipo') = 'certidao_tipo'
  (Normalize-Key 'Certidão Número') = 'certidao_numero'
  (Normalize-Key 'Certidão Livro') = 'certidao_livro'
  (Normalize-Key 'Certidão Folha') = 'certidao_folha'
  (Normalize-Key 'Tipo Sanguíneo') = 'tipo_sanguineo'
  (Normalize-Key 'Escolaridade') = 'escolaridade'
  (Normalize-Key 'Categoria CNH') = 'categoria_cnh'
  (Normalize-Key 'Empresa') = 'empresa'
  (Normalize-Key 'Profissão') = 'profissao'
  (Normalize-Key 'Telefone Trabalho') = 'telefone_trabalho'
  (Normalize-Key 'Data de Cadastro') = 'data_cadastro'
  (Normalize-Key 'Observações') = 'observacoes'
  (Normalize-Key 'Congregação') = 'congregacao_id'
}

$zip = [System.IO.Compression.ZipFile]::OpenRead($XlsxPath)
try {
  function Get-WorksheetEntryName([System.IO.Compression.ZipArchive]$Zip, [int]$Index, [string]$Name) {
    $wbXml = Get-ZipText $Zip 'xl/workbook.xml'
    if (-not $wbXml) { throw 'workbook.xml não encontrado no arquivo xlsx.' }
    [xml]$wb = $wbXml
    $wbNs = [System.Xml.XmlNamespaceManager]::new($wb.NameTable)
    $null = $wbNs.AddNamespace('d', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
    $null = $wbNs.AddNamespace('r', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')

    $sheets = @()
    foreach ($s in $wb.SelectNodes('//d:sheets/d:sheet', $wbNs)) {
      $sid = [string]$s.sheetId
      $sname = [string]$s.name
      $rid = [string]$s.GetAttribute('id', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships')
      if (-not $rid) { $rid = [string]$s.'r:id' }
      $sheets += [pscustomobject]@{ sheetId = $sid; name = $sname; rid = $rid }
    }
    if (-not $sheets.Count) { throw 'Nenhuma planilha encontrada no workbook.' }

    $relsXml = Get-ZipText $Zip 'xl/_rels/workbook.xml.rels'
    if (-not $relsXml) { throw 'workbook.xml.rels não encontrado no arquivo xlsx.' }
    [xml]$rels = $relsXml
    $relById = @{}
    foreach ($rel in $rels.Relationships.Relationship) {
      $relById[[string]$rel.Id] = [string]$rel.Target
    }

    $pick = $null
    if ($Name) {
      $pick = $sheets | Where-Object { $_.name -eq $Name } | Select-Object -First 1
      if (-not $pick) { throw "Planilha '$Name' não encontrada. Disponíveis: $($sheets.name -join ', ')" }
    } elseif ($Index -gt 0) {
      if ($Index -gt $sheets.Count) { throw "SheetIndex inválido ($Index). Total: $($sheets.Count)." }
      $pick = $sheets[$Index - 1]
    } else {
      $pick = $sheets[0]
    }

    $target = $relById[[string]$pick.rid]
    if (-not $target) { throw "Relacionamento não encontrado para a planilha '$($pick.name)'." }
    $entry = 'xl/' + ($target -replace '^/+', '')
    return [pscustomobject]@{ entry = $entry; name = $pick.name; sheets = $sheets }
  }

  $sharedStrings = @()
  $sharedXml = Get-ZipText $zip 'xl/sharedStrings.xml'
  if ($sharedXml) {
    [xml]$sx = $sharedXml
    foreach ($si in $sx.sst.si) {
      $t = ''
      if ($si.t) { $t = [string]$si.t }
      elseif ($si.r) { $t = ($si.r | ForEach-Object { [string]$_.t }) -join '' }
      $sharedStrings += $t
    }
  }

  $stylesXml = Get-ZipText $zip 'xl/styles.xml'
  $styleIndexToIsDate = @{}
  if ($stylesXml) {
    [xml]$st = $stylesXml
    $customNumFmt = @{}
    foreach ($n in $st.styleSheet.numFmts.numFmt) {
      $id = [int]$n.numFmtId
      $code = [string]$n.formatCode
      $customNumFmt[$id] = $code
    }
    $xfs = @($st.styleSheet.cellXfs.xf)
    for ($i = 0; $i -lt $xfs.Count; $i++) {
      $numFmtId = [int]$xfs[$i].numFmtId
      $isDate = (IsDateNumFmtId $numFmtId) -or (IsDateFormatCode ($customNumFmt[$numFmtId]))
      $styleIndexToIsDate[$i] = $isDate
    }
  }

  function GetCellValue($c) {
    if (-not $c) { return @{ value = ''; isDate = $false } }
    $t = [string]$c.t
    $v = [string]$c.v
    $s = [string]$c.s
    $styleIdx = 0
    if ($s -match '^\d+$') { $styleIdx = [int]$s }
    $isDate = $false
    if ($styleIndexToIsDate.ContainsKey($styleIdx)) { $isDate = [bool]$styleIndexToIsDate[$styleIdx] }

    if ($t -eq 's') {
      if ($v -match '^\d+$') {
        $i = [int]$v
        if ($i -ge 0 -and $i -lt $sharedStrings.Count) { return @{ value = $sharedStrings[$i]; isDate = $false } }
      }
      return @{ value = ''; isDate = $false }
    }

    return @{ value = $v; isDate = $isDate }
  }

  $wsInfo = Get-WorksheetEntryName -Zip $zip -Index $SheetIndex -Name $SheetName
  [xml]$ws = (Get-ZipText $zip $wsInfo.entry)
  if (-not $ws) { throw "Não foi possível ler a planilha '$($wsInfo.name)' ($($wsInfo.entry))." }
  $ns = [System.Xml.XmlNamespaceManager]::new($ws.NameTable)
  $null = $ns.AddNamespace('d', 'http://schemas.openxmlformats.org/spreadsheetml/2006/main')
  $rows = $ws.SelectNodes('//d:sheetData/d:row', $ns)
  if (-not $rows -or $rows.Count -lt 2) { throw 'Planilha sem dados suficientes (precisa de cabeçalho + linhas).' }

  $grid = @()
  foreach ($row in $rows) {
    $cells = $row.SelectNodes('d:c', $ns)
    $max = 0
    foreach ($c in $cells) {
      $ci = CellRefToColIndex ([string]$c.r)
      if ($ci -gt $max) { $max = $ci }
    }
    $arr = @(@{ value = ''; isDate = $false }) * $max
    foreach ($c in $cells) {
      $ci = CellRefToColIndex ([string]$c.r)
      if ($ci -le 0) { continue }
      $arr[$ci - 1] = (GetCellValue $c)
    }
    $grid += ,$arr
  }

  $headerRow = $grid[0]
  $headers = @()
  foreach ($cell in $headerRow) { $headers += [string]$cell.value }

  function IndexToColLetters([int]$idx) {
    $n = $idx + 1
    $s = ''
    while ($n -gt 0) {
      $r = ($n - 1) % 26
      $s = [char]([int][char]'A' + $r) + $s
      $n = [math]::Floor(($n - 1) / 26)
    }
    return $s
  }

  $colMap = @{}
  for ($i = 0; $i -lt $headers.Count; $i++) {
    $h = [string]$headers[$i]
    $hn = Normalize-Key $h
    $key = $null
    if ($fields.ContainsKey($h)) { $key = ($fields.Keys | Where-Object { $_ -ieq $h } | Select-Object -First 1) }
    elseif ($labelToKey.ContainsKey($hn)) { $key = $labelToKey[$hn] }
    elseif ($synonyms.ContainsKey($hn)) { $key = $synonyms[$hn] }
    elseif ($fields.ContainsKey($hn)) { $key = ($fields.Keys | Where-Object { $_ -ieq $hn } | Select-Object -First 1) }
    elseif (-not $h) {
      $colLetters = IndexToColLetters $i
      if ($wsInfo.name -eq 'Membros') {
        if ($colLetters -eq 'B') { $key = 'sexo' }
        elseif ($colLetters -eq 'C') { $key = 'data_nascimento' }
      }
    }
    if (-not $key) { continue }
    if ($key -ne '__grupo_nome' -and -not $fields.ContainsKey([string]$key)) { continue }
    $colMap[$i] = [string]$key
  }

  if ($wsInfo.name -eq 'Membros') {
    if (-not $colMap.ContainsKey(7) -and $fields.ContainsKey('cargo_ministerial')) { $colMap[7] = 'cargo_ministerial' }
    if (-not $colMap.ContainsKey(6)) { $colMap[6] = '__grupo_nome' }
    if (-not $colMap.ContainsKey(1) -and $fields.ContainsKey('sexo')) { $colMap[1] = 'sexo' }
    if (-not $colMap.ContainsKey(2) -and $fields.ContainsKey('data_nascimento')) { $colMap[2] = 'data_nascimento' }
    if (-not $colMap.ContainsKey(8) -and $fields.ContainsKey('observacoes')) { $colMap[8] = 'observacoes' }
  }

  function ScoreDateColumn([int]$colIndex) {
    $score = 0
    $maxRows = [math]::Min(12, $grid.Count - 1)
    for ($ri = 1; $ri -le $maxRows; $ri++) {
      $c = $grid[$ri][$colIndex]
      if ($null -eq $c) { continue }
      $v = ([string]$c.value).Trim()
      if (-not $v) { continue }
      if ($v -match '^\d{4}-\d{2}-\d{2}$') { $score += 3 }
      elseif ($v -match '^\d{2}/\d{2}/\d{4}$') { $score += 2 }
      elseif ($v -match '^\d{2}-\d{2}$') { $score += 1 }
    }
    return $score
  }

  $groupColIndex = $null
  $dateCols = @()
  foreach ($kv in $colMap.GetEnumerator()) {
    if ($kv.Value -eq '__grupo_nome') { $groupColIndex = [int]$kv.Key }
    if ($kv.Value -eq 'data_nascimento') { $dateCols += [int]$kv.Key }
  }
  if ($dateCols.Count -gt 1) {
    $best = $dateCols | Sort-Object { - (ScoreDateColumn $_) } | Select-Object -First 1
    foreach ($c in $dateCols) {
      if ($c -ne $best) { $colMap.Remove($c) | Out-Null }
    }
  }

  $usedKeys = New-Object System.Collections.Generic.HashSet[string]
  $mappedCols = @()
  foreach ($kv in $colMap.GetEnumerator()) {
    $mappedCols += [pscustomobject]@{ Col = [int]$kv.Key; Key = [string]$kv.Value }
    if ($kv.Value -ne '__grupo_nome') {
      $null = $usedKeys.Add([string]$kv.Value)
    }
  }
  $mappedCols = $mappedCols | Sort-Object Col

  $insertCols = @()
  foreach ($k in $usedKeys) { $insertCols += [string]$k }
  $insertCols = @($insertCols | Sort-Object)
  if (-not $insertCols.Count) { throw 'Não foi possível mapear nenhuma coluna da planilha para o schema.' }

  $sql = New-Object System.Text.StringBuilder
  $null = $sql.AppendLine("begin;")

  for ($r = 1; $r -lt $grid.Count; $r++) {
    $row = $grid[$r]
    $allEmpty = $true
    foreach ($m in $mappedCols) {
      $c = $row[$m.Col]
      $v = ''
      if ($null -ne $c -and $null -ne $c.value) { $v = ([string]$c.value).Trim() }
      if ($v -ne '') { $allEmpty = $false; break }
    }
    if ($allEmpty) { continue }

    $valuesSql = @()
    foreach ($colKey in $insertCols) {
      $cellVal = $null
      $cellIsDate = $false
      foreach ($m in $mappedCols) {
        if ($m.Key -ne $colKey) { continue }
        $c = $row[$m.Col]
        $cellVal = [string]$c.value
        $cellIsDate = [bool]$c.isDate
        break
      }

      if ($null -eq $cellVal) { $valuesSql += 'NULL'; continue }
      $cellVal = $cellVal.Trim()
      if ($cellVal -eq '') { $valuesSql += 'NULL'; continue }

      if ($colKey -eq 'sexo') {
        $sv = Normalize-Key $cellVal
        if (@('m', 'masc', 'masculino').Contains($sv)) { $cellVal = 'Masculino' }
        elseif (@('f', 'fem', 'feminino').Contains($sv)) { $cellVal = 'Feminino' }
      }

      $field = $fields[$colKey]
      $type = [string]$field.type
      $source = $field.source
      if ($type -eq 'checkbox') {
        $b = To-BoolOrNull $cellVal
        if ($null -eq $b) { $valuesSql += 'NULL' }
        elseif ($b) { $valuesSql += 'true' }
        else { $valuesSql += 'false' }
        continue
      }

      if ($type -eq 'date' -or $type -eq 'datetime-local') {
        if ($cellIsDate -and $cellVal -match '^[0-9]+(\\.[0-9]+)?$') {
          $dt = ExcelSerialToDateTime ([double]$cellVal)
          if ($type -eq 'date') { $valuesSql += (Escape-SqlString ($dt.ToString('yyyy-MM-dd'))) }
          else { $valuesSql += (Escape-SqlString ($dt.ToString('yyyy-MM-ddTHH:mm:ss'))) }
          continue
        }
        $valuesSql += (Escape-SqlString $cellVal)
        continue
      }

      if ($source) {
        $srcTable = [string]$source.table
        $srcLabel = [string]$source.label
        if ($srcTable -and $srcLabel) {
          $valuesSql += "(select id from public.$srcTable where $srcLabel = $(Escape-SqlString $cellVal) limit 1)"
          continue
        }
      }

      if ($cellVal -match '^-?\\d+(\\.[0-9]+)?$' -and $type -ne 'text' -and $type -ne 'tel' -and $type -ne 'email' -and $type -ne 'textarea') {
        $valuesSql += $cellVal
        continue
      }

      $valuesSql += (Escape-SqlString $cellVal)
    }

    $missingRequired = $false
    foreach ($rk in $requiredKeys) {
      $idx = [array]::IndexOf($insertCols, $rk)
      if ($idx -lt 0) { continue }
      if ($valuesSql[$idx] -eq 'NULL') { $missingRequired = $true; break }
    }
    if ($missingRequired) { continue }

    $colsSql = ($insertCols | ForEach-Object { $_ }) -join ', '
    $valsSql = ($valuesSql | ForEach-Object { $_ }) -join ', '
    $null = $sql.AppendLine("insert into $TargetTable ($colsSql) values ($valsSql);")

    if ($null -ne $groupColIndex) {
      $gv = ''
      $gc = $row[$groupColIndex]
      if ($null -ne $gc -and $null -ne $gc.value) { $gv = ([string]$gc.value).Trim() }
      if ($gv) {
        $nomeIdx = [array]::IndexOf($insertCols, 'nome')
        if ($nomeIdx -ge 0 -and $valuesSql[$nomeIdx] -ne 'NULL') {
          $nomeSql = $valuesSql[$nomeIdx]
          $grupoSql = Escape-SqlString $gv
          $null = $sql.AppendLine("insert into public.membros_grupo (id_membro, id_grupo) select m.id, g.id from (select id from public.membros where nome = $nomeSql limit 1) m, (select id from public.grupos where nome = $grupoSql limit 1) g;")
        }
      }
    }
  }

  $null = $sql.AppendLine("commit;")
  [System.IO.File]::WriteAllText($OutSqlPath, $sql.ToString(), [Text.Encoding]::UTF8)

  Write-Output "SHEET: $($wsInfo.name)"
  Write-Output "OK: $(($grid.Count - 1)) linhas lidas; SQL gerado em $OutSqlPath"
  Write-Output "COLS: $($insertCols -join ', ')"
} finally {
  if ($zip) { $zip.Dispose() }
}

